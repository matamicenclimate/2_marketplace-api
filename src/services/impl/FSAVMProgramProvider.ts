import * as AVMProgramProvider from '@common/services/AVMProgramProvider'
import * as fs from 'fs/promises';

@AVMProgramProvider.declare()
export default class FSAVMProgramProvider implements AVMProgramProvider.type {
  get auctionApprovalProgram(): Promise<Uint8Array> {
    return fs.readFile('./contracts/auction_approval.teal',).then((buffer) => new Uint8Array(buffer))
  }
  get clearStateProgram(): Promise<Uint8Array> {
    return fs.readFile('./contracts/auction_clear_state.teal',).then((buffer) => new Uint8Array(buffer))
  }
}
