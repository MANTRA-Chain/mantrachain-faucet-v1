"use strict";

import {bech32} from "bech32";
import {mantraAddressPrefix} from "./constant.js";

/**
 * Convert EVM address to MANTRA address.
 * References:
 * - https://docs.cronos.org/for-dapp-developers/chain-integration/adress-conversion
 * - https://en.bitcoin.it/wiki/BIP_0173
 * @param {string} evmAddress
 * @returns {string}
 */
export const convertEVMAddressToMantraAddress = (evmAddress) => {
  const evmAddressBuffer = Buffer.from(evmAddress.slice(2), 'hex');
  const evmAddressBytes = Array.from(evmAddressBuffer);
  const bz = convertBits(evmAddressBytes, 8, 5);
  return bech32.encode(mantraAddressPrefix, bz);
}

export const convertMantraAddressToEVMAddress = (mantraAddress) => {
  const decoded = bech32.decode(mantraAddress);
  const hexBytes = convertBits(decoded.words, 5, 8, false);
  return `0x${Buffer.from(hexBytes).toString('hex')}`;
}

/**
 * General power-of-2 base conversion.
 * References:
 * - https://en.bitcoin.it/wiki/Bech32
 * - https://github.com/fiatjaf/bech32/blob/master/bech32/__init__.py
 * @param {Array<number>} data - Input data as an array of integers
 * @param {number} fromBits - Number of bits in source representation
 * @param {number} toBits - Number of bits in target representation
 * @param {boolean} pad - Whether to pad a result if needed
 * @returns {Array<number>|null} - Converted data or null if conversion fails
 */
export const convertBits = (data, fromBits, toBits, pad = true) => {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  const max_acc = (1 << (fromBits + toBits - 1)) - 1;

  for (const value of data) {
    if (value < 0 || (value >> fromBits)) {
      return null;
    }
    acc = ((acc << fromBits) | value) & max_acc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      ret.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }

  return ret;
}
