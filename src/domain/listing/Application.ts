import algosdk from "algosdk";
import { AssetNormalized } from "src/interfaces";

export default class Application {
  public getApplicationAddressFromAppIndex(appIndex: number) {
    return algosdk.getApplicationAddress(appIndex)
  }

  public getNote(asset: AssetNormalized, appIndex: number) {
    return algosdk.encodeObj({
      ...asset,
      arc69: {
        ...asset.arc69,
        properties: {
          ...asset.arc69.properties,
          app_id: appIndex,
        },
      },
    })
  }
}