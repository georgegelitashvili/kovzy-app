import React, { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";
import { LanguageContext } from "../Language";
import OrdersModalMoreActions from "../modal/OrdersModalMoreActions";
import { OrderActionLabelButton, OrderActionRow } from "./OrderActionButtons";

export default function OrderCardActions({
  onAccept,
  onReject,
  onEdit,
  onSchedule,
  onDelay,
  acceptLabel,
  rejectLabel,
  showEdit = false,
  showSchedule = false,
  showDelay = false,
  loading = false,
}) {
  const { dictionary } = useContext(LanguageContext);
  const [moreActionsVisible, setMoreActionsVisible] = useState(false);
  const hasMoreActions = showEdit || showSchedule || showDelay;

  return (
    <Card.Actions style={styles.actions}>
      <View style={styles.actionsWrap}>
        <OrderActionRow>
          {(sizes) => (
            <>
              <OrderActionLabelButton
                variant="accept"
                label={acceptLabel || dictionary["orders.accept"] || "Accept"}
                disabled={loading}
                sizes={sizes}
                onPress={() => {
                  if (loading) return;
                  setMoreActionsVisible(false);
                  onAccept?.();
                }}
              />

              <OrderActionLabelButton
                variant="reject"
                label={rejectLabel || dictionary["orders.reject"] || "Reject"}
                disabled={loading}
                sizes={sizes}
                onPress={() => {
                  if (loading) return;
                  setMoreActionsVisible(false);
                  onReject?.();
                }}
              />

              {hasMoreActions ? (
                <OrderActionLabelButton
                  variant="more"
                  icon="dots-horizontal"
                  disabled={loading}
                  sizes={sizes}
                  onPress={() => {
                    if (loading) return;
                    setMoreActionsVisible((prev) => !prev);
                  }}
                />
              ) : null}
            </>
          )}
        </OrderActionRow>

        <OrdersModalMoreActions
          visible={moreActionsVisible && hasMoreActions}
          onClose={() => setMoreActionsVisible(false)}
          showEdit={showEdit}
          showSchedule={showSchedule}
          showDelay={showDelay}
          loading={loading}
          onEdit={onEdit}
          onSchedule={onSchedule}
          onDelay={onDelay}
        />
      </View>
    </Card.Actions>
  );
}

const styles = StyleSheet.create({
  actions: {
    width: "100%",
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 4,
    alignItems: "stretch",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
  },
  actionsWrap: {
    width: "100%",
    alignSelf: "stretch",
    flexGrow: 1,
  },
});
