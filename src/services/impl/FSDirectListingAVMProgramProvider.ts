import AlgodClientProvider from '@common/services/AlgodClientProvider'
import * as AVMDirectListingProgramProvider from '@common/services/AVMDirectListingProgramProvider'
import * as fs from 'fs/promises'
import { Inject } from 'typedi'

@AVMDirectListingProgramProvider.declare()
export default class FSDirectListingAVMProgramProvider implements AVMDirectListingProgramProvider.type {
  @Inject()
  private readonly algoClientProvider: AlgodClientProvider
  get directListingApprovalProgram(): Promise<Uint8Array> {
    return fs
      .readFile('./contracts/sale_approval.teal')
      .then(async buffer => {
        const program: { result: string } = await this.algoClientProvider.client
          .compile(this.toUTF8Bytes(buffer.toString()))
          .do()
        return new Uint8Array(Buffer.from(program.result, 'base64'))
      })
  }
  get clearStateProgram(): Promise<Uint8Array> {
    return fs
      .readFile('./contracts/sale_clear_state.teal')
      .then(async buffer => {
        const program: { result: string } = await this.algoClientProvider.client
          .compile(this.toUTF8Bytes(buffer.toString()))
          .do()
        return new Uint8Array(Buffer.from(program.result, 'base64'))
      })
  }

  toUTF8Bytes(bufferString: string) {
    let encoder = new TextEncoder()
    return encoder.encode(bufferString)
  }
}
