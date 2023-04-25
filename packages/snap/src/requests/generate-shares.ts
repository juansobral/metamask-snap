import { Json, JsonRpcRequest } from '@metamask/snaps-types';
import { copyable, panel, text } from '@metamask/snaps-ui';
import { ParamsType } from '../../../../types/params.type';
import { arraySharesToTextAndCopyType } from '../types/text-and-copy.type';
import { getUserAddress } from '../helpers/get-user-address.helper';

function slip39EncodeHex(str: any) {
  const bytes = [];
  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

function generateSecretKeys(slip: any, groups: [number, number, string][]) {
  let secret;
  let numberOfParticipants;
  const secretCodeList: string[][] = [];
  for (let i = 0; i < groups.length; i++) {
    numberOfParticipants = groups[i][1];
    secretCodeList.push([]);
    secretCodeList[i].push(
      `${groups[i][2]} (Participantes: ${numberOfParticipants})`,
    );

    for (let j = 0; j < numberOfParticipants; j++) {
      secret = slip.fromPath(`r/${i}/${j}`).mnemonics;
      secretCodeList[i].push(secret[0]);
    }
  }
  return secretCodeList;
}

function arraySharesToTextAndCopy(
  array: string[][],
): arraySharesToTextAndCopyType[][] {
  const response: arraySharesToTextAndCopyType[][] = [];
  array.forEach((share, index) =>
    share.forEach((code, i) => {
      if (i === 0) {
        response.push([text(code)]);
      } else {
        response[index].push(text(`${i} ) `));
        response[index].push(copyable(code));
      }
    }),
  );
  return response;
}

function sharesToList(
  array: arraySharesToTextAndCopyType[][],
): arraySharesToTextAndCopyType[] {
  const response: arraySharesToTextAndCopyType[] = [];
  array.forEach((group) => group.forEach((item) => response.push(item)));
  return response;
}

export const generateShares = async (
  request: JsonRpcRequest<Json[] | Record<string, Json>>,
  slip39: any,
) => {
  const firstAccount = await getUserAddress(0);

  let threshold: ParamsType['threshold'] | undefined = undefined;
  let passphrase: ParamsType['passphrase'] | undefined = undefined;
  let groups: ParamsType['groups'] | undefined = undefined;

  if (request.params instanceof Array) {
    throw new Error('No lo esparaba');
  } else {
    Object.entries(request.params).forEach(([key, value]) => {
      if (key === 'groups' && value instanceof Array) {
        groups = value as ParamsType['groups'];
      }
      if (key === 'threshold' && typeof value === 'string') {
        threshold = value;
      }
      if (key === 'passphrase' && typeof value === 'string') {
        passphrase = value;
      }
    });
  }
  let params: ParamsType | undefined;
  if (threshold && groups && passphrase) {
    params = {
      threshold,
      groups,
      passphrase,
    };
  }

  if (!params) throw new Error('Error con los params');

  const slip = slip39.fromArray(slip39EncodeHex(firstAccount.privateKey), {
    passphrase: params.passphrase,
    threshold: params.threshold,
    groups: params.groups,
    title: 'Slip39 example for 2-level SSSS',
  });

  const secretCodeList = generateSecretKeys(slip, params.groups);

  const shares = arraySharesToTextAndCopy(secretCodeList);

  const sharesList = sharesToList(shares);

  const customResult = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        text(`Hi your share list is:`),
        text(' -------------------------------------- '),
        ...sharesList,
      ]),
    },
  });
  if (customResult === true) {
    // Do the action
  }
};