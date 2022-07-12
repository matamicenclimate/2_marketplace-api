import { CreateListingResponse } from "@common/lib/api/endpoints";
import { AuctionLogic } from "@common/services/AuctionLogic";
import * as WalletAccountProvider from '@common/services/WalletAccountProvider'
import * as TransactionSigner from '@common/services/TransactionSigner'
import algosdk from "algosdk";
import CustomLogger from "src/infrastructure/CustomLogger";
import { AssetNormalized, AuctionCreateAppData, CauseAppInfo, ListingStrategy } from "src/interfaces";
import Container from "typedi";
import { DataSource } from "typeorm";


export default class DirectLisgingStrategy implements ListingStrategy {
  readonly auctionLogic: AuctionLogic
  readonly account: WalletAccountProvider.type
  private logger: CustomLogger
  @TransactionSigner.inject() 
  readonly signer: TransactionSigner.type

  constructor (private cause: CauseAppInfo) {
    this.auctionLogic = Container.get(AuctionLogic)
    this.logger = new CustomLogger()
  }

  
  async execute(db: DataSource, body: AuctionCreateAppData, asset: AssetNormalized): Promise<CreateListingResponse> {
    // const note = asset.note
    // this._avoidErrorMetadataQuantityOnBlockchain(asset)
    // const appIndex = await this.createApp(
    //   body.assetId,
    //   asset,
    //   body.creatorWallet,
    //   body.startDate,
    //   body.endDate,
    //   db,
    //   note
    // )
    // this.logger.info(
    //   `DONE: Sending back the asset ${body.assetId} to wallet owner.`
    // )

      const unsignedTxnGroup = algosdk.assignGroupID([])

      // this.createGroupTxn(appIndex, body.assetId, asset)
      // await this.storeSellingData(db, body, asset, appIndex)


    /* @ts-ignore */
    return { appIndex: 0, unsignedTxnGroup }
  }


}