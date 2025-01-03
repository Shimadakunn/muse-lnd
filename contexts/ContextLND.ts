/* @flow */
import EventEmitter from "EventEmitter";
import React, { Component, constructor, createContext } from "react";
import { Platform } from "react-native";

import type { Wallet } from "../types/types.js";

const LndContext = createContext({
  startLnd: () => {},
  stopLnd: () => {}
});

import Api from "../hooks/api.js";
import LndApi from "../hooks/restLnd.js";
import WalletKeychain from "../hooks/walletKeychain.js";
import { default as WalletListener, default as walletListener } from "../hooks/walletListener.js";
import {
    encodeBase64,
    fileExists,
    getAppDir,
    getLastNLines,
    getMacaroonHex,
    isLndProcessRunning,
    readFile,
    scanQrCode,
    startLnd,
    stopLnd,
    writeFile
} from "../utils/nativeRtxModule.js";

const WALLET_CONF_FILE = "wallet.conf";
export const DEFAULT_NEUTRINO_CONNECT = "btcd0.lightning.engineering";
const satToBtc = Math.pow(10, -8);

const walletConfFilename = async function() {
  const appDir = await getAppDir();
  const walletDir = appDir + "/" + WALLET_CONF_FILE;
  return walletDir;
};

const readWalletConfig = async function() {
  const conf = await readFile(await walletConfFilename());
  const json = JSON.parse(conf && conf != "" ? conf : "{}");
  json.wallets = json.wallets || [];
  for (let i = 0; i < json.wallets.length; i++) {
    const wallet = json.wallets[i];
    const walletExists = await fileExists(wallet.name);
    if (!walletExists) {
      wallet["exists"] = false;
    }
    if (!wallet.usesKeychain) {
      wallet.usesKeychain = false;
    }
  }
  return json;
};

const writeWalletConfig = async function(contentJSON) {
  return await writeFile(
    await walletConfFilename(),
    JSON.stringify(contentJSON, null, 2)
  );
};

const addWallet = async function(newWallet: Wallet) {
  newWallet.usesKeychain = newWallet.usesKeychain || false;
  // Only keep known fields from newWallet.
  newWallet = (({
    name,
    coin,
    network,
    mode,
    neutrinoConnect,
    usesKeychain
  }) => ({
    name,
    coin,
    network,
    mode,
    neutrinoConnect,
    usesKeychain,
    ix: 0
  }))(newWallet);

  // the wallets have folders appDir/wallets/<X>/ structure, the X can't be
  // based on user input because of utf-8 and different input possible,
  // it needs to be generated uniquely, easiest way to do is an int,
  // go through list of all wallets find the max int and increase by 1.
  let walletIx = 0;

  // Validate first
  const currentConfig = await readWalletConfig();
  currentConfig.wallets = currentConfig.wallets || [];
  for (let i = 0; i < currentConfig.wallets.length; i++) {
    const wallet = currentConfig.wallets[i];
    if (newWallet.name == wallet.name) {
      throw new Error("Wallet with this name already exists!");
    }
    if (wallet.ix && wallet.ix > walletIx) {
      walletIx = wallet.ix;
    }
  }

  newWallet.ix = walletIx + 1;

  currentConfig.wallets.push(newWallet);
  await writeWalletConfig(currentConfig);
  return newWallet;
};

// This function will find the wallet by ix in wallet.conf and
// replace it's fields with the updatedWallet.
// TODO: it's worth putting all wallet.conf related functionality
// into a class of it's own.
const updateWalletConf = async function(updatedWallet) {
  const currentConfig = await readWalletConfig();
  currentConfig.wallets = currentConfig.wallets || [];
  for (let i = 0; i < currentConfig.wallets.length; i++) {
    const wallet = currentConfig.wallets[i];
    if (wallet.ix == updatedWallet.ix) {
      currentConfig.wallets[i] = updatedWallet;
    }
  }
  await writeWalletConfig(currentConfig);
};

const walletDir = async function(wallet: ?Wallet): Promise<string> {
  return (await getAppDir()) + "/wallets/" + ((wallet && wallet.ix) || 0) + "/";
};

const logDir = async function(wallet: ?Wallet): Promise<?string> {
  let w = wallet;
  if (!wallet) {
    const runningWallet = await getRunningWallet();
    if (runningWallet) {
      w = runningWallet;
    } else {
      return;
    }
  }
  if (!w) {
    return;
  }
  const walletD = await walletDir(w);
  return walletD + "logs/" + (w && w.coin) + "/" + (w && w.network) + "/";
};

const getLogs = async function(nLines: number) {
  try {
    const runningWallet = await getRunningWallet();
    const logD = await logDir(runningWallet);
    const logFile = (logD || "") + "lnd.log";
    const lastN = await getLastNLines(logFile, nLines);
    return lastN;
  } catch (e) {}
};

const getWalletFile = async function(file: string) {
  try {
    const walletD = await walletDir(await getRunningWallet());
    return await readFile(walletD + file);
  } catch (e) {}
};

const getWalletMacaroon = async function(file): Promise<string> {
  try {
    const currentWallet = await getRunningWallet();
    if (!currentWallet) return "";
    const walletD = await walletDir(currentWallet);
    const macPath =
      walletD +
      "data/chain/" +
      currentWallet.coin +
      "/" +
      currentWallet.network +
      "/";
    return await getMacaroonHex(macPath + file);
  } catch (e) {
    return "";
  }
};

const writeLndConf = async function(wallet) {
  const walletDirectory = await walletDir(wallet);
  const network = wallet.network || "testnet";
  const neutrino = wallet.mode == "neutrino" ? "bitcoin.node=neutrino" : "";
  const neutrinoConnect = (wallet.neutrinoConnect || DEFAULT_NEUTRINO_CONNECT)
    .split(",")
    .filter(String);
  let peers = "";
  for (let i = 0; i < neutrinoConnect.length; i++) {
    let peer = neutrinoConnect[i];
    peers += (peers.length == 0 ? "" : "\n") + "neutrino.connect=" + peer;
  }
  let profile = "";
  let debuglevel = "error";
  if (__DEV__) {
    profile = "profile=6060";
    debuglevel = "info";
  }
  const conf = `[Application Options]
debuglevel=${debuglevel}
maxpendingchannels=10
maxlogfiles=3
maxlogfilesize=10
${profile}

[Routing]
routing.assumechanvalid=1

[Bitcoin]
bitcoin.active=1
bitcoin.${network}=1
${neutrino}

[Neutrino]
${peers}`;
  console.log("Writing lnd.conf for wallet:");
  console.log(wallet);
  console.log("The lnd.conf");
  console.log(conf);
  return await writeFile(walletDirectory + "/lnd.conf", conf);
};

const startLndFromWallet = async function(wallet?: Wallet): Promise<any> {
  if (!wallet || !wallet.ix) {
    throw new Error("Can't start lnd without a wallet!");
  }
  await writeLndConf(wallet);
  return await startLnd(await walletDir(wallet));
};

const stopLndFromWallet = async function(wallet) {
  return await stopLnd(await walletDir(wallet));
};

const getRunningWallet = async function(): Promise<?Wallet> {
  const isRunning = await isLndProcessRunning();
  if (!isRunning) {
    return;
  }

  const filesDir = await getAppDir();
  const lastRunning = await readFile(filesDir + "/lastrunninglnddir.txt");
  if (lastRunning == "") {
    return;
  }
  const walletIx = parseInt(
    lastRunning
      .split("/")
      .filter(String)
      .splice(-1)[0]
  );
  const walletConf = await readWalletConfig();
  for (let i = 0; i < walletConf.wallets.length; i++) {
    const wallet = walletConf.wallets[i];
    if (parseInt(wallet.ix) == walletIx) {
      return wallet;
    }
  }
};

const initWallet = async function(wallet, cipher, password) {};

type Props = {
  children: Object
};
type State = {
  walletConf: Object,
  displayUnit: "satoshi",
  qrCodeEvents: Object,
  keychain?: WalletKeychain,
  walletListener?: WalletListener,
  rawtxApi?: Object
};
class LndProvider extends Component<Props, State> {
  channelListener_: Object;
  hideActionSheet: ?((void) => Promise<?any>) => void;
  showActionSheet: ?((void) => void) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      displayUnit: "satoshi",
      fiatUnit: "USD",
      walletConf: {},
      stopLnd,
      getInfo: LndApi.getInfo,
      genSeed: LndApi.genSeed,
      lndApi: LndApi,
      addWallet: this.addWalletUpdateState,
      wallets: [],
      getDisplayUnit: this.getDisplayUnit,
      displayUnitToSatoshi: this.displayUnitToSatoshi,
      displayFiat: this.displayFiat,
      startLndFromWallet,
      isLndProcessRunning,
      getRunningWallet: this._getRunningWallet,
      walletDir,
      encodeBase64,
      stopLndFromWallet,
      displaySatoshi: this.displaySatoshi,
      scanQrCode: this.scanQrCode(),
      isInitialInvoiceHandled: this.isInitialInvoiceHandled,
      setInitialInvoiceHandled: this.setInitialInvoiceHandled,
      getLogs,
      getWalletFile,
      getWalletMacaroon,
      updateWalletConf: this.updateWalletConfState,
      GENESIS_BLOCK_TIMESTAMP: 1231006505,

      setActionSheetMethods: this.setActionSheetMethods,
      clearActionSheetMethods: this.clearActionSheetMethods,
      qrCodeEvents: new EventEmitter()
    };
  }

  componentDidMount() {
    readWalletConfig().then(cfg =>
      this.setState({ walletConf: cfg, wallets: cfg.wallets })
    );
    const keychain = new WalletKeychain();
    const walletListener = new WalletListener(LndApi);
    this.setState({ walletListener, walletKeychain: keychain });
    this.reactivateInactiveChannels(walletListener, LndApi);
  }

  initRawtxApiIfNotExists = async (wallet: Wallet) => {
    if (
      this.state.rawtxApi &&
      this.state.rawtxApi.coin == wallet.coin &&
      this.state.rawtxApi.network == wallet.network
    ) {
      return this.state.rawtxApi;
    }
    const rawtxApi = new Api(wallet.coin, wallet.network);
    const updatePrices = async () => {
      const fiatPrices = await rawtxApi.prices();
      this.setState({ fiatPrices });
    };
    // TODO: enable price updating.
    // updatePrices();
    return new Promise((resolve, _) => {
      this.setState(
        {
          rawtxApi
        },
        () => resolve(rawtxApi)
      );
    });
  };

  componentWillUnmount() {
    this.channelListener_.remove();
  }

  // Because of changing ip addresses and ports, some channels
  // go inactive when can't communicate with the peer.
  reactivateInactiveChannels(
    walletListener: WalletListener,
    lndApi: typeof LndApi
  ) {
    let rateLimit = -1;
    this.channelListener_ = walletListener.listenToChannels(async c => {
      if (!c || !c.channels) return;
      const inactive_pubkeys = c.channels
        .filter(c => !c.active)
        .map(c => c.remote_pubkey);
      if (inactive_pubkeys.length == 0) {
        return;
      }
      rateLimit++;
      if (rateLimit > 10) {
        rateLimit = 0;
      }
      if (rateLimit != 0) {
        return;
      }
      for (let i = 0; i < inactive_pubkeys.length; i++) {
        const inactive = inactive_pubkeys[i];
        const { node } = await lndApi.getNodeInfo(inactive);
        if (node.addresses && node.addresses.length > 0) {
          const b = await lndApi.addPeers(
            node.pub_key,
            node.addresses[0].addr,
            true
          );
        }
      }
    });
  }

  // Returns string representation with the unit
  // (ex displaySatoshi(2) = "2 sat")
  displaySatoshi = (satoshi: number) => {
    if (!satoshi) return;
    if (this.state.displayUnit == "satoshi") {
      return insertSpaceEvery3Digit(satoshi) + " sat";
    }
    //TODO: otherwise convert
  };

  getDisplayUnit = () => {
    // TODO: add possibility to change it
    return "satoshi";
  };

  displayUnitToSatoshi = (amount_in_display_unit: number) => {
    if (this.getDisplayUnit() == "satoshi") {
      return amount_in_display_unit;
    }
    //TODO: implement
  };

  displayFiat = (satoshi: number) => {
    if (
      !satoshi ||
      !this.state.fiatPrices ||
      !this.state.fiatPrices[this.state.fiatUnit]
    ) {
      return;
    }
    const fiatPrice = this.state.fiatPrices[this.state.fiatUnit];
    const btc = satoshi * satToBtc;
    const price = btc * fiatPrice * 10000;
    return insertSpaceEvery3Digit(price) + " " + this.state.fiatUnit;
  };

  initialInvoiceHandled = false;
  // Deep linking in Android using Linking.getInitialUrl always will have
  // value so if multiple components use it, each one of them will run.
  // Make sure it's handled only once.
  isInitialInvoiceHandled = () => {
    return this.initialInvoiceHandled;
  };

  setInitialInvoiceHandled = () => {
    this.initialInvoiceHandled = true;
  };

  setActionSheetMethods = (
    hideActionSheet: ((void) => Promise<?any>) => void,
    showActionSheet: ((void) => void) => void
  ) => {
    this.hideActionSheet = hideActionSheet;
    this.showActionSheet = showActionSheet;
  };

  clearActionSheetMethods = () => {
    this.hideActionSheet = null;
    this.showActionSheet = null;
  };

  // this method also makes sure LndApi has the right admin.macaroon.
  _getRunningWallet = async () => {
    const w = await getRunningWallet();
    LndApi.setAdminMacaroon(await getWalletMacaroon("admin.macaroon"));
    this._getRawtxApi();
    return w;
  };

  _getRawtxApi = async () => {
    const w = await getRunningWallet();
    if (!w) return;
    return await this.initRawtxApiIfNotExists(w);
  };

  scanQrCode = () => {
    if (Platform.OS == "ios") {
      // On iOS, qr scanner works as a modal, showing 2 modals is
      // strange, so we hide the actionsheet,show qr code, show
      // actionsheet again.
      return async () => {
        if (this.hideActionSheet && this.showActionSheet) {
          return new Promise((resolve, _) => {
            this.hideActionSheet &&
              this.hideActionSheet(async () => {
                const qr = await scanQrCode();
                const forShowingActionSheet = new Promise((resolve, _) => {
                  this.showActionSheet &&
                    this.showActionSheet(() => {
                      resolve();
                    });
                });
                await forShowingActionSheet;
                // hack to give modal children enough time to finish with animation
                await sleep(200);
                this.state.qrCodeEvents.emit("qrCodeScanned", qr);
              });
          });
        } else {
          return await scanQrCode();
        }
      };
    } else {
      return scanQrCode;
    }
  };

  addWalletUpdateState = async newWallet => {
    newWallet = await addWallet(newWallet);
    const newConf = await readWalletConfig();
    await writeLndConf(newWallet);
    this.setState({ walletConf: newConf, wallets: newConf.wallets });
    return newWallet;
  };

  updateWalletConfState = async updatedWallet => {
    await updateWalletConf(updatedWallet);
    readWalletConfig().then(cfg =>
      this.setState({ walletConf: cfg, wallets: cfg.wallets })
    );
  };

  render() {
    return (
      <LndContext.Provider value={this.state}>
        {this.props.children}
      </LndContext.Provider>
    );
  }
}

export default LndContext.Consumer;
export { LndProvider };
