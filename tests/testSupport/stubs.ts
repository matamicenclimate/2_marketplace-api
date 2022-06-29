import ListingService from "src/services/ListingService"
import SellingService from 'src/services/SellingsService'
import { TransactionOperation } from '@common/services/TransactionOperation'
import { AuctionLogic } from "@common/services/AuctionLogic"
import { AxiosResponse } from 'axios'
import sinon from 'sinon'
import algosdk from 'algosdk'
import { populatedAsset } from './mocks'
import { AuctionCreationResult } from "@common/lib/AuctionCreationResult"
import TransactionGroupService from "src/services/TransactionGroupService"

export const stubCreateAuction = (assetId: number) => {
  sinon.stub(TransactionGroupService.prototype, 'execute').resolves(20942)
  sinon.stub(ListingService.prototype, 'populateAsset').resolves({ ...populatedAsset.data, id: assetId })
  sinon.stub(ListingService.prototype, 'normalizeAsset').resolves({
      value: {
          ...{
              arc69: {
                  description: 'dafd',
                  external_url: 'ipfs://bafybeihhargel6lngmkyhuhdfxfsyq5c2krs442f5ujit2vkfymjgebvpe/1641997247445.jpg',
                  mime_type: 'image/jpeg',
                  properties: {
                      artist: 'fadfd',
                      cause: 'Causa benefica developers',
                      causePercentage: 30,
                      date: '2022-03-28T09:24:44.271Z',
                      file: [Object],
                      price: 57
                  },
                  standard: 'arc69'
              },
              image_url: 'https://cloudflare-ipfs.com/ipfs/bafybeihhargel6lngmkyhuhdfxfsyq5c2krs442f5ujit2vkfymjgebvpe/1641997247445.jpg',
              ipnft: 'bafyreihwepvmnt5gbh6rtxbkftk5a7ztdzef7as3auaqobedbyzlkhzqyq',
              title: 'asd',
              url: 'ipfs://bafyreihwepvmnt5gbh6rtxbkftk5a7ztdzef7as3auaqobedbyzlkhzqyq/metadata.json'
          },
          creator: 'creator',
          id: assetId
      },
      isDefined: () => true
  })
  sinon.stub(SellingService.prototype, '_rekeyingTemporaryAccount').resolves(true as any)
  sinon.stub(SellingService.prototype, 'getCauseInfo').resolves({
      data: { "id": "0e4407aa-cfb0-4a5e-9e99-51da39e148e7", "title": "Causa benefica developers", "description": "Thanks...", "wallet": "M32VTQGHNSDPIQE3VXCRSYWFPCUGVHQQPKQPEK5IAGKTJEAGEBRC7QU5OU", "imageUrl": "https://educowebmedia.blob.core.windows.net/educowebmedia/educospain/media/images/blog/ong-y-ods.jpg", "createdAt": "2022-03-25T11:33:30.000Z", "updatedAt": "2022-03-25T11:33:30.000Z" }
  } as AxiosResponse)
  sinon.stub(SellingService.prototype, '_getCausesPercentages').resolves({
      data: { "percentages": { "marketplace": "10", "cause": "50" } }
  } as AxiosResponse)
  sinon.stub(algosdk, 'generateAccount').resolves({
      addr: 'rekey-account',
      sk: 'secret'
  })
  sinon.stub(algosdk, 'secretKeyToMnemonic').resolves('memonic words')
  sinon.stub(algosdk, 'getApplicationAddress').resolves('app-address')
  sinon.stub(algosdk, 'encodeObj').resolves({
      note: new Uint8Array()
  })
  sinon.stub(TransactionOperation.prototype, 'pay').resolves({
      txId: 20942,
  } as { txId: number; result: Record<string, unknown>; })
  sinon.stub(TransactionOperation.prototype, 'signAndConfirm').resolves({
      txId: 20942,
  } as { txId: number; result: Record<string, unknown>; })
  sinon.stub(AuctionLogic.prototype, 'createAuction').resolves(
      {
          'application-index': 23409723
      } as AuctionCreationResult
  )
  sinon.stub(AuctionLogic.prototype, 'makeTransferToAccount').resolves({
      txId: 2924
  } as any)
  sinon.stub(AuctionLogic.prototype, 'fundListing').resolves({
      amount: 1000000,
      result: {
          txId: 2924
      } as { txId: number; result: Record<string, unknown>; }
  })
  sinon.stub(AuctionLogic.prototype, 'makeAppCallSetupProc').resolves({
      txId: 2924
  } as { txId: number; result: Record<string, unknown>; })
}