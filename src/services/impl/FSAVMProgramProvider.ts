import AlgodClientProvider from '@common/services/AlgodClientProvider'
import * as AVMProgramProvider from '@common/services/AVMProgramProvider'
import * as fs from 'fs/promises'
import { Inject } from 'typedi'

@AVMProgramProvider.declare()
export default class FSAVMProgramProvider implements AVMProgramProvider.type {
  @Inject()
  private readonly algoClientProvider: AlgodClientProvider
  get auctionApprovalProgram(): Promise<Uint8Array> {
    return fs
      .readFile('./contracts/auction_approval.teal')
      .then(async buffer => {
        const program: { result: string } = await this.algoClientProvider.client
          .compile(this.toUTF8Bytes(buffer.toString()))
          .do()
        return new Uint8Array(Buffer.from(program.result, 'base64'))
      })
  }
  get clearStateProgram(): Promise<Uint8Array> {
    return fs
      .readFile('./contracts/auction_clear_state.teal')
      .then(async buffer => {
        const program: { result: string } = await this.algoClientProvider.client
          .compile(this.toUTF8Bytes(buffer.toString()))
          .do()
        return new Uint8Array(Buffer.from(program.result, 'base64'))
      })
  }

  toUTF8Bytes(bufferString: string) {
    let encoder = new TextEncoder();
    return encoder.encode(bufferString);
  }
}
