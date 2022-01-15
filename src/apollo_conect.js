import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  gql,
  HttpLink,
  split,
} from "@apollo/client";

import { setContext } from "@apollo/client/link/context";

import { createAuthLink } from "aws-appsync-auth-link";

import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { v4 as uuidv4 } from "uuid";
import { SubscriptionClient } from "subscriptions-transport-ws";
import * as gPrinter from "graphql/language/printer";

const createAppSyncGraphQLOperationAdapter = () => ({
  applyMiddleware: async (options, next) => {
    // AppSync expects GraphQL operation to be defined as a JSON-encoded object in a "data" property
    options.data = JSON.stringify({
      query:
        typeof options.query === "string"
          ? options.query
          : gPrinter.print(options.query),
      variables: options.variables,
    });

    // AppSync only permits authorized operations
    options.extensions = { authorization: h };

    // AppSync does not care about these properties
    delete options.operationName;
    delete options.variables;
    // Not deleting "query" property as SubscriptionClient validation requires it

    next();
  },
});
class UUIDOperationIdSubscriptionClient extends SubscriptionClient {
  generateOperationId() {
    // AppSync recommends using UUIDs for Subscription IDs but SubscriptionClient uses an incrementing number
    return uuidv4();
  }
  processReceivedData(receivedData) {
    try {
      const parsedMessage = JSON.parse(receivedData);
      if (parsedMessage?.type === "start_ack") return; // sent by AppSync but meaningless to us
    } catch (e) {
      throw new Error("Message must be JSON-parsable. Got: " + receivedData);
    }
    super.processReceivedData(receivedData);
  }
}

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
const wsLink = new WebSocketLink({
  uri: uriwss,
  options: {
    reconnect: true,
  },
});

	const wsLink2 = new WebSocketLink(
	  new UUIDOperationIdSubscriptionClient(
	    uriwss,
	    {
	      timeout: 5 * 60 * 1000,
	      reconnect: true,
	      lazy: true,
	      connectionCallback: (err) =>
	        console.log("connectionCallback", err ? "ERR" : "OK", err || ""),
	    },
	    WebSocket
	  ).use([createAppSyncGraphQLOperationAdapter()])
	);
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
    link: wsLink2,
    cache: new InMemoryCache(),
  });

  return client;
};
export { apolloClient, apolloCLientWss };
