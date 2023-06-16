const eventBus = {

    on(event: any, callback: any) {
        document.addEventListener(event, (e) => callback(e.detail));
    },
    dispatch(event: any, data: any) {
        console.log("dispatch", data );
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event: any, callback: any) {
      document.removeEventListener(event, callback);
    },


    EVENTS: {
        GET_TOP_WALLETS_FOR_TOKEN: "top_wallets_for_token",
        START_TRACKING_TOKEN: "start_tracking_token",
        START_TRACKING_WALLET: "start_tracking_wallet",
    }
};

export default eventBus;