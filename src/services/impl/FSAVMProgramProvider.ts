import AlgodClientProvider from '@common/services/AlgodClientProvider';
import * as AVMProgramProvider from '@common/services/AVMProgramProvider'
import * as fs from 'fs/promises';
import { Inject } from 'typedi';

@AVMProgramProvider.declare()
export default class FSAVMProgramProvider implements AVMProgramProvider.type {
  @Inject()
  private readonly algoClientProvider: AlgodClientProvider
  get auctionApprovalProgram(): Promise<Uint8Array> {
    return fs.readFile('./contracts/auction_approval.teal',).then(async (buffer) => {
      const program: string = await this.algoClientProvider.client.compile(buffer.toString()).do()
      return Buffer.from(program, 'base64')
    })
  }
  get clearStateProgram(): Promise<Uint8Array> {
    return fs.readFile('./contracts/auction_clear_state.teal',).then(async (buffer) => {
      const program: string = await this.algoClientProvider.client.compile(buffer.toString()).do()
      return Buffer.from(program, 'base64')
    })
  }
}
