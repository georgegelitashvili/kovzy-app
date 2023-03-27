import React, { useState, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { StyleSheet, View } from "react-native";
import {
  List,
  Text
} from "react-native-paper";

import { getData } from "../../helpers/storage";
import { String, LanguageContext } from '../Language';
import { Request } from "../../axios/apiRequests";
import { languageList } from "../languages";



export default function OrdersDetail({ orderId, lang })
{
    const [expanded, setExpanded] = useState(true);
    const handlePress = () => setExpanded(!expanded);

    const [orderCart, setOrderCart] = useState([]);

    const [options, setOptions] = useState({}); // api options
    const [optionsIsLoaded, setOptionsIsLoaded] = useState(false); // api options

    const { dictionary } = useContext(LanguageContext);

    const readData = async () => {
        await getData("domain").then(data => {
          setOptions({
            method: "POST",
            data: {Orderid: orderId,lang: lang},
            url: `https://${data.value}/api/getOrderCart`
          });
          setOptionsIsLoaded(true);
        })
      };

    // console.log('------------ orderDetail Lang');
    // console.log(lang);
    // console.log('------------ end orderDetail Lang');

      useEffect(() => {
        readData();
        if(optionsIsLoaded) {
            Request(options).then(resp => setOrderCart(resp));
          }
      }, [optionsIsLoaded]);

      useEffect(() => {
        if(lang) {
          setOptions({...options, data: {Orderid: orderId, lang: lang}})
        }
      }, [lang, orderId])

      useEffect(() => {
        if(options) {
          Request(options).then(resp => setOrderCart(resp));
        }
      }, [options])


    if(orderCart?.length == 0){
      return null;
    }

    return (
      <List.Section>
        <List.Accordion
          title={dictionary['orders.orderProducts']}
          expanded={expanded}
          onPress={handlePress}
        >
          {orderCart?.map((item, index) => {
            if(item.cart_id == orderId) {
              let optionsMarkup = null;

              if(item.type == 1) {
                optionsMarkup = item.children?.map((child) => {
                  return `${child.name}: ${ child.customizables.map((cust) => {return `${cust.name}: ${cust.packs?.map((e) => e.name).join(', ')}`;})}; `}).join('');
              }else if(item.type == 0) {
                optionsMarkup = item.customizables?.map((cust) => {return `${cust.name}: ${ cust.packs?.map((e) => e.name).join(', ') }; `}).join('');
              }

              return (
                <View style={styles.body} key={item.cart_id + '.' + index}>
                  <Text style={styles.header}>{(index+1) + '.'} {item.name}</Text>
                  <Text style={styles.option}>{dictionary['amount']}: {item.amount}</Text>
                  {optionsMarkup ? (
                    <Text style={styles.option}>Options:({optionsMarkup})</Text>
                  ) : (<Text style={styles.option}>Options:()</Text>)}

                </View>
              )

            }
          })}
        </List.Accordion>
      </List.Section>
    )
}


const styles = StyleSheet.create({
    accordion: {
        background: "#fff",
    },
    body: {
      padding: 5
    },
    header: {
      fontWeight: '700'
    },
    option: {
      opacity: 0.6,
      paddingHorizontal: 15,
      fontWeight: '500'
    }
});