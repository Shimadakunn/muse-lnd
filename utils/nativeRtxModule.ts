/* @flow */
import { DeviceEventEmitter, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

const Rtx = NativeModules.RtxModule;

const startLnd = async function(lndDir: string) {
  const running = await isLndProcessRunning();
  if (running) {
    console.error("LND is already running, can only run 1 instance of LND!");
    return;
  }
  return await NativeModules.RtxModule.startLnd(lndDir);
};

const stopLnd = async function(lndDir: string) {
  return await NativeModules.RtxModule.stopLnd(lndDir);
};

const getLastNLines = async function(file: string, n: number) {
  return await Rtx.getLastNLines(file, n);
};

const startWatchingLogContent = function(callback: string => void) {
  DeviceEventEmitter.addListener("LND_LOGS_MODIFIED", callback);
};

const stopWatchingLogContent = function(callback: void => void) {
  DeviceEventEmitter.removeListener("LND_LOGS_MODIFIED", callback);
};

// if request contains:
// method: "post"
// jsonBody: JSONObject
// it will send a POST request to url
const fetch = async function(request: Object) {
  return await Rtx.fetch(request);
};

const readWalletConfig = async function() {
  return await Rtx.readWalletConfig();
};

const readFile = async function(filename: string) {
  return await Rtx.readFile(filename);
};

const writeFile = async function(filename: string, content: string) {
  return await Rtx.writeFile(filename, content);
};

const fileExists = async function(filename: string) {
  return await Rtx.fileExists(filename);
};

// Directory where we can read and write app specific files, where lnd will
// be created.
const getAppDir = async function(): Promise<string> {
  return await Rtx.getFilesDir();
};

const isLndProcessRunning = async function() {
  return await Rtx.isLndProcessRunning();
};

const encodeBase64 = async function(str: string) {
  return await Rtx.encodeBase64(str);
};

const scanQrCode = async function() {
  let result = await Rtx.scanQrCode();
  // TODO: this is a super ugly hack.
  // animation when coming out of qr code scanning view
  // can create layout bugs (LayoutAnimation on android has
  // issues). for now, just sleep a little bit to give
  // time for the original layout to come back.
  await sleep(500);
  return result;
};

const getMacaroonHex = async function(macaroonFile: string) {
  return await Rtx.getMacaroonHex(macaroonFile);
};

// TODO: remove after migration of neutrino
const deleteOldNeutrino = async function(walletDir: string) {
  const d = walletDir + "/data/chain/bitcoin/testnet/";
  let contents = await RNFS.readdir(d);
  contents = contents.filter(c => c != "wallet.db");
  for (let c of contents) {
    try {
      await RNFS.unlink(d + c);
    } catch (err) {
      console.error("couldn't delete old neutrino", err);
    }
  }
};

export {
    deleteOldNeutrino, encodeBase64, fetch, fileExists,
    getAppDir, getLastNLines, getMacaroonHex, isLndProcessRunning, readFile, scanQrCode, startLnd, startWatchingLogContent, stopLnd, stopWatchingLogContent, writeFile
};
