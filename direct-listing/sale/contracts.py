from pyteal import *


def approval_program():
    seller_key = Bytes("seller")
    nft_id_key = Bytes("nft_id")
    reserve_amount_key = Bytes("reserve_amount")
    bid_amount_key = Bytes("bid_amount")
    bid_account_key = Bytes("bid_account")
    nft_creator_key = Bytes("creator")
    nft_cause_key = Bytes("cause")
    creator_percentaje = Bytes("creator_percentaje")
    cause_percentaje = Bytes("cause_percentaje")
    rekey_key = Bytes("rekey")
    bid_fee_transactions = 0
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
    @Subroutine(TealType.uint64)
    def onDeleteSubroutine() -> Expr:
        return on_delete

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
            If(creator_percentaje > Int(0)).Then(
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
        )

    @Subroutine(TealType.none)
    def on_create():
        nft_asa_id = Btoi(Txn.application_args[1])
        nft_clawback = AssetParam.clawback(nft_asa_id)
        nft_freeze = AssetParam.freeze(nft_asa_id)
        valid_create = Assert(
            And(
                nft_clawback.value() == Int(0),
                nft_freeze.value() == Int(0)
            )
        )
        return Seq(
            nft_clawback,
            nft_freeze,
            valid_create,
            App.globalPut(seller_key, Txn.application_args[0]),
            App.globalPut(nft_id_key, Btoi(Txn.application_args[1])),
            App.globalPut(reserve_amount_key, Btoi(Txn.application_args[2])),
            App.globalPut(nft_creator_key, Txn.application_args[3]),
            App.globalPut(nft_cause_key, Txn.application_args[4]),
            App.globalPut(creator_percentaje, Btoi(Txn.application_args[5])),
            App.globalPut(cause_percentaje, Btoi(Txn.application_args[6])),
            App.globalPut(rekey_key, Txn.application_args[7]),
            # igual que hacer un approve pero sin el return implicito
            Int(1),
        )

    on_setup_selector = MethodSignature("on_setup()void")
    @Subroutine(TealType.none)
    def on_setup():
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields(
                {
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.xfer_asset: App.globalGet(nft_id_key),
                    TxnField.asset_receiver: Global.current_application_address(),
                }
            ),
            InnerTxnBuilder.Submit(),
            # igual que hacer un approve pero sin el return implicito
            Int(1)        
        )

    on_delete = Seq(
        If(App.globalGet(bid_account_key) != Global.zero_address())
        .Then(
            If(
                App.globalGet(bid_amount_key)
                >= App.globalGet(reserve_amount_key)
            )
            .Then(
                Seq(
                    payAmountToCreator(
                        App.globalGet(bid_amount_key),
                        App.globalGet(nft_creator_key),
                        App.globalGet(creator_percentaje),
                    ),
                    payAmountToCause(
                        App.globalGet(bid_amount_key),
                        App.globalGet(nft_cause_key),
                        App.globalGet(cause_percentaje),
                    ),
                    closeNFTTo(
                        App.globalGet(nft_id_key),
                        App.globalGet(bid_account_key),
                    ),
                )
            )
            .Else(
                Seq(
                    closeNFTTo(
                        App.globalGet(nft_id_key),
                        App.globalGet(seller_key),
                    ),
                )
            )
        )
        .Else(
            Seq(
                closeNFTTo(App.globalGet(nft_id_key), App.globalGet(seller_key)),
            )
        ),
        closeAccountTo(App.globalGet(seller_key)),
        Approve(),
    )

    on_bid_selector = MethodSignature("on_bid()void")
    @Subroutine(TealType.none)
    def on_bid():
        payment_txn = Gtxn[Txn.group_index() - Int(1)]
        valid_bid = Assert(
            And(
                App.globalGet(bid_account_key) == Int(0),
                payment_txn.type_enum() == TxnType.Payment,
                payment_txn.sender() == Txn.sender(),
                payment_txn.receiver() == Global.current_application_address(),
                payment_txn.amount() >= Global.min_txn_fee(),
            )
        )
        return Seq(
            valid_bid,
            If(
                payment_txn.amount()
                >= App.globalGet(reserve_amount_key)
            ).Then(
                Seq(
                    App.globalPut(bid_amount_key, (payment_txn.amount() - (Int(bid_fee_transactions + bid_deposit_transactions) * Global.min_txn_fee()))),
                    App.globalPut(bid_account_key, payment_txn.sender()),
                    Return(onDeleteSubroutine()),
                ),
            ).Else(
                Reject(), 
            ),
        )

    on_call = Cond(
        [Txn.application_args[0] == on_setup_selector, Return(on_setup())],
        [Txn.application_args[0] == on_bid_selector, on_bid],
    )

    return Cond(
        [Txn.application_id() == Int(0), Return(on_create())],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.DeleteApplication, Approve()],
        [
            Or(
                Txn.on_completion() == OnComplete.OptIn,
                Txn.on_completion() == OnComplete.CloseOut,
                Txn.on_completion() == OnComplete.UpdateApplication,
            ),
            Reject(),
        ],
    )

def clear_state_program():
    return Approve()


if __name__ == "__main__":
    with open("../contracts/sale_approval.teal", "w") as f:
        compiled = compileTeal(
            approval_program(), mode=Mode.Application, version=5)
        f.write(compiled)

    with open("../contracts/sale_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(),
                               mode=Mode.Application, version=5)
        f.write(compiled)
