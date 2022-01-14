import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  gql,
  HttpLink,
	split
} from "@apollo/client";

import { setContext } from "@apollo/client/link/context";

import { createAuthLink } from "aws-appsync-auth-link";

import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

const endpoint =
  "https://we2zjvgvrzbfdnzh6wihtx3gnq.appsync-api.us-east-2.amazonaws.com/graphql";
const endpointwss =
  "wss://we2zjvgvrzbfdnzh6wihtx3gnq.appsync-realtime-api.us-east-2.amazonaws.com/graphql";
const api_key = "da2-sygrydt25vfktl4pv23mmsnmsm";
const region = "us-east-2";
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "x-api-key": api_key,
    },
  };
});

const httpLink = new HttpLink({
  uri: endpoint,
});
const p = {};
const h = {
  host: "we2zjvgvrzbfdnzh6wihtx3gnq.appsync-api.us-east-2.amazonaws.com",
  "x-api-key": api_key,
};
//const headerBase64 = btoa(JSON.stringify(h));
const headerBase64 = Buffer.from(JSON.stringify(h)).toString("base64");
//const payloadBase64 = btoa(JSON.stringify(p));
const payloadBase64 = btoa(JSON.stringify(p));
const uriwss = `${endpointwss}?header=${headerBase64}&payload=${payloadBase64}`;
console.log(uriwss);
  const wsLink = new WebSocketLink({
    uri: uriwss,
    options: {
      reconnect: true,
    },
  });
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);
const apolloClient = () => {
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });

  return client;
};
const apolloCLientWss = () => {

  //  const authLink = setContext((_, { headers }) => {
  //    return {
  //      headers: {
  //        ...headers,
  //        host: "we2zjvgvrzbfdnzh6wihtx3gnq.appsync-api.us-east-2.amazonaws.com",
  //        "x-api-key": api_key,
  //      },
  //    };
  //  });

  const client = new ApolloClient({
    // link: authLink.concat(wsLink),
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return client;
};
export { apolloClient, apolloCLientWss };
