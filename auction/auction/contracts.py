from pyteal import *


def approval_program():
    seller_key = Bytes("seller")
    nft_id_key = Bytes("nft_id")
    start_time_key = Bytes("start")
    end_time_key = Bytes("end")
    reserve_amount_key = Bytes("reserve_amount")
    min_bid_increment_key = Bytes("min_bid_inc")
    num_bids_key = Bytes("num_bids")
    lead_bid_amount_key = Bytes("bid_amount")
    lead_bid_account_key = Bytes("bid_account")
    nft_creator_key = Bytes("creator")
    nft_cause_key = Bytes("cause")
    creator_percentaje = Bytes("creator_percentaje")
    cause_percentaje = Bytes("cause_percentaje")
    rekey_key = Bytes("rekey")
    bid_fee_transactions = 2
    bid_deposit_transactions = 7

    @Subroutine(TealType.none)
    def closeNFTTo(assetID: Expr, account: Expr) -> Expr:
        asset_holding = AssetHolding.balance(
            Global.current_application_address(), assetID
        )
        return Seq(
            asset_holding,
            If(asset_holding.hasValue()).Then(
                Seq(
                    InnerTxnBuilder.Begin(),
                    InnerTxnBuilder.SetFields(
                        {
                            TxnField.type_enum: TxnType.AssetTransfer,
                            TxnField.xfer_asset: assetID,
                            TxnField.asset_close_to: account,
                        }
                    ),
                    InnerTxnBuilder.Submit(),
                )
            ),
        )
    @Subroutine(TealType.none)
    def repayPreviousLeadBidder(prevLeadBidder: Expr, prevLeadBidAmount: Expr) -> Expr:
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.amount: prevLeadBidAmount + (Int(bid_deposit_transactions) * Global.min_txn_fee()) - Global.min_txn_fee(),
                    TxnField.receiver: prevLeadBidder,
                }
            ),
            InnerTxnBuilder.Submit(),
        )

    @Subroutine(TealType.none)
    def closeAccountTo(account: Expr) -> Expr:
        return If(Balance(Global.current_application_address()) != Int(0)).Then(
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.close_remainder_to: account,
                    }
                ),
                InnerTxnBuilder.Submit(),
            )
        )
    
    @Subroutine(TealType.none)
    def payAmountToCause(bid_amount: Expr, nft_cause_key: Expr, cause_percentaje: Expr) -> Expr:
        cause_amount = ((cause_percentaje * bid_amount) / Int(100))
        return If(Balance(Global.current_application_address()) != Int(0)).Then(
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.amount: cause_amount,
                        TxnField.receiver: nft_cause_key,
                    }
                ),
                InnerTxnBuilder.Submit(),
            ),
        )
    @Subroutine(TealType.none)
    def payAmountToCreator(bid_amount: Expr, nft_creator_key: Expr, creator_percentaje: Expr) -> Expr:
        creator_amount = ((creator_percentaje * bid_amount) / Int(100))
        return If(Balance(Global.current_application_address()) != Int(0)).Then(
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields(
                    {
                        TxnField.type_enum: TxnType.Payment,
                        TxnField.amount: creator_amount,
                        TxnField.receiver: nft_creator_key,
                    }
                ),
                InnerTxnBuilder.Submit(),
            ),
        )

    on_create_start_time = Btoi(Txn.application_args[2])
    on_create_end_time = Btoi(Txn.application_args[3])
    on_create = Seq(
        App.globalPut(seller_key, Txn.application_args[0]),
        App.globalPut(nft_id_key, Btoi(Txn.application_args[1])),
        App.globalPut(start_time_key, on_create_start_time),
        App.globalPut(end_time_key, on_create_end_time),
        App.globalPut(reserve_amount_key, Btoi(Txn.application_args[4])),
        App.globalPut(min_bid_increment_key, Btoi(Txn.application_args[5])),
        App.globalPut(nft_creator_key, Txn.application_args[6]),
        App.globalPut(nft_cause_key, Txn.application_args[7]),
        App.globalPut(creator_percentaje, Btoi(Txn.application_args[8])),
        App.globalPut(cause_percentaje, Btoi(Txn.application_args[9])),
        App.globalPut(rekey_key, Txn.application_args[10]),
        App.globalPut(lead_bid_account_key, Global.zero_address()),
        Assert(
            And(
                Global.latest_timestamp() < on_create_start_time,
                on_create_start_time < on_create_end_time,
                # TODO: should we impose a maximum auction length?
            )
        ),
        Approve(),
    )

    on_setup = Seq(
        Assert(Global.latest_timestamp() < App.globalGet(start_time_key)),
        # opt into NFT asset -- because you can't opt in if you're already opted in, this is what
        # we'll use to make sure the contract has been set up
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: App.globalGet(nft_id_key),
                TxnField.asset_receiver: Global.current_application_address(),
            }
        ),
        InnerTxnBuilder.Submit(),
        Approve(),
    )

    on_bid_txn_index = Txn.group_index() - Int(1)
    on_bid_nft_holding = AssetHolding.balance(
        Global.current_application_address(), App.globalGet(nft_id_key)
    )
    on_bid = Seq(
        on_bid_nft_holding,
        # the auction has been set up
        Assert(on_bid_nft_holding.hasValue()),
        Assert(on_bid_nft_holding.value() > Int(0)),
        # the auction has started
        Assert(App.globalGet(start_time_key) <= Global.latest_timestamp()),
        # the auction has not ended
        Assert(Global.latest_timestamp() < App.globalGet(end_time_key)),
        # the actual bid payment is before the app call
        Assert(Gtxn[on_bid_txn_index].type_enum() == TxnType.Payment),
        Assert(Gtxn[on_bid_txn_index].sender() == Txn.sender()),
        Assert(Gtxn[on_bid_txn_index].receiver() ==
               Global.current_application_address()),
        Assert(Gtxn[on_bid_txn_index].amount() >= Global.min_txn_fee()),
        If(
            Gtxn[on_bid_txn_index].amount()
            >= App.globalGet(lead_bid_amount_key) + App.globalGet(min_bid_increment_key)
        ).Then(
            Seq(
                If(App.globalGet(lead_bid_account_key) != Global.zero_address()).Then(
                    repayPreviousLeadBidder(
                        App.globalGet(lead_bid_account_key),
                        App.globalGet(lead_bid_amount_key),
                    )
                ),
                App.globalPut(lead_bid_amount_key, (Gtxn[on_bid_txn_index].amount() - (Int(bid_fee_transactions + bid_deposit_transactions) * Global.min_txn_fee()))),
                App.globalPut(lead_bid_account_key, Gtxn[on_bid_txn_index].sender()),
                App.globalPut(num_bids_key, App.globalGet(num_bids_key) + Int(1)),
                Approve(),
            )
        ),
        Reject(),
    )

    on_call_method = Txn.application_args[0]
    on_call = Cond(
        [on_call_method == Bytes("setup"), on_setup],
        [on_call_method == Bytes("bid"), on_bid],
    )

    on_delete = Seq(
        If(Global.latest_timestamp() < App.globalGet(start_time_key)).Then(
            Seq(
                # the auction has not yet started, it's ok to delete
                Assert(
                    Or(
                        # sender must either be the seller or the auction creator
                        Txn.sender() == App.globalGet(seller_key),
                        Txn.sender() == Global.creator_address(),
                    )
                ),
                # if the auction contract account has opted into the nft, close it out
                closeNFTTo(App.globalGet(nft_id_key), App.globalGet(seller_key)),
                # if the auction contract still has funds, send them all to the seller
                closeAccountTo(App.globalGet(seller_key)),
                Approve(),
            )
        ),
        If(App.globalGet(end_time_key) <= Global.latest_timestamp()).Then(
            Seq(
                # the auction has ended, pay out assets
                If(App.globalGet(lead_bid_account_key) != Global.zero_address())
                .Then(
                    If(
                        App.globalGet(lead_bid_amount_key)
                        >= App.globalGet(reserve_amount_key)
                    )
                    .Then(
                        # the auction was successful: send lead bid account the nft
                        Seq(
                            payAmountToCreator(
                                App.globalGet(lead_bid_amount_key),
                                App.globalGet(nft_creator_key),
                                App.globalGet(creator_percentaje),
                            ),
                            payAmountToCause(
                                App.globalGet(lead_bid_amount_key),
                                App.globalGet(nft_cause_key),
                                App.globalGet(cause_percentaje),
                            ),
                            closeNFTTo(
                                App.globalGet(nft_id_key),
                                App.globalGet(lead_bid_account_key),
                            ),
                        )
                    )
                    .Else(
                        Seq(
                            # the auction was not successful because the reserve was not met: return
                            # the nft to the seller and repay the lead bidder
                            closeNFTTo(
                                App.globalGet(nft_id_key),
                                App.globalGet(seller_key),
                            ),
                            repayPreviousLeadBidder(
                                App.globalGet(lead_bid_account_key),
                                App.globalGet(lead_bid_amount_key),
                            ),
                        )
                    )
                )
                .Else(
                    # the auction was not successful because no bids were placed: return the nft to the seller
                    closeNFTTo(App.globalGet(nft_id_key), App.globalGet(seller_key))
                ),
                # send remaining funds to the seller
                closeAccountTo(App.globalGet(seller_key)),
                Approve(),
            )
        ),
        Reject(),
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [
            Txn.on_completion() == OnComplete.DeleteApplication,
            on_delete,
        ],
        [
            Or(
                Txn.on_completion() == OnComplete.OptIn,
                Txn.on_completion() == OnComplete.CloseOut,
                Txn.on_completion() == OnComplete.UpdateApplication,
            ),
            Reject(),
        ],
    )

    return program


def clear_state_program():
    return Approve()


if __name__ == "__main__":
    with open("../contracts/auction_approval.teal", "w") as f:
        compiled = compileTeal(
            approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("../contracts/auction_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(),
                               mode=Mode.Application, version=5)
        f.write(compiled)
