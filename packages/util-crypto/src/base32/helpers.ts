// Copyright 2017-2022 @polkadot/util-crypto authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { U8aLike } from '@polkadot/util/types';

import { u8aToU8a } from '@polkadot/util';

// re-export the type so *.d.ts files don't have ../src imports
export type { U8aLike } from '@polkadot/util/types';

interface Coder {
  decode: (value: string) => Uint8Array;
  encode: (value: Uint8Array) => string;
}

interface Config {
  chars: string;
  coder: Coder;
  ipfs?: string;
  regex?: RegExp;
  type: string;
}

type DecodeFn = (value: string, ipfsCompat?: boolean) => Uint8Array;

type EncodeFn = (value: U8aLike, ipfsCompat?: boolean) => string;

type ValidateFn = (value?: unknown, ipfsCompat?: boolean) => value is string;

/** @internal */
export function createDecode ({ coder, ipfs }: Config, validate: ValidateFn): DecodeFn {
  return (value: string, ipfsCompat?: boolean): Uint8Array => {
    validate(value, ipfsCompat);

    return coder.decode(
      ipfs && ipfsCompat
        ? value.substring(1)
        : value
    );
  };
}

/** @internal */
export function createEncode ({ coder, ipfs }: Config): EncodeFn {
  return (value: U8aLike, ipfsCompat?: boolean): string => {
    const out = coder.encode(u8aToU8a(value));

    return ipfs && ipfsCompat
      ? `${ipfs}${out}`
      : out;
  };
}

/** @internal */
export function createIs (validate: ValidateFn): ValidateFn {
  return (value?: unknown, ipfsCompat?: boolean): value is string => {
    try {
      return validate(value, ipfsCompat);
    } catch (error) {
      return false;
    }
  };
}

/** @internal */
export function createValidate ({ chars, ipfs, type }: Config): ValidateFn {
  return (value?: unknown, ipfsCompat?: boolean): value is string => {
    if (!value || typeof value !== 'string') {
      throw new Error(`Expected non-null, non-empty ${type} string input`);
    }

    if (ipfs && ipfsCompat && value[0] !== ipfs) {
      throw new Error(`Expected ipfs-compatible ${type} to start with '${ipfs}'`);
    }

    for (let i = (ipfsCompat ? 1 : 0); i < value.length; i++) {
      if (!(chars.includes(value[i]) || (
        value[i] === '=' && (
          (i === value.length - 1) ||
          !chars.includes(value[i + 1])
        )
      ))) {
        throw new Error(`Invalid ${type} character "${value[i]}" (0x${value.charCodeAt(i).toString(16)}) at index ${i}`);
      }
    }

    return true;
  };
}
