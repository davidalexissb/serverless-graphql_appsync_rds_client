import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import { useState } from "react";
import {
  apolloClient,
  apolloCLientWss,
} from "./apollo_conect";
import { gql } from "@apollo/client";

function App() {
  const [posiciones, setPosiciones] = useState([]);

  const getPositions = () => {
    apolloClient()
      .query({
        query: gql`
          query MyQuery {
            getPosiciones {
              id_pos
              lat
              lng
            }
          }
        `,
      })
      .then((result) => console.log(result));
  };

  const postPositions = () => {
    apolloClient()
      .mutate({
        mutation: gql`
          mutation MyMutation {
            addPos(
              input: {
                lat: "1"
                lng: "1"
                feccreacion: "2022-01-14"
                id_usu: 1
              }
            ) {
              id_pos
              lat
              lng
              id_usu
              feccreacion
            }
          }
        `,
      })
      .then((result) => {
        //console.log(result)
      });
  };

  //probamos la suscripcion
  const subscription = apolloCLientWss()
    .subscribe({
      query: gql`
        subscription MySubscription {
          addedPos {
            feccreacion
            id_pos
            id_usu
            lat
            lng
          }
        }
      `,
    })
    .subscribe({
      next(data) {
        console.log({ data });
      },
      error({ error }) {
        console.log({ error });
      },
      complete() {
        console.log("subs. DONE");
      }, // never printed
    });
  return (
    <div className="App">
      <button onClick={getPositions}>getPositions</button>
      <button onClick={postPositions}>postPositions</button>
      {posiciones &&
        posiciones.map((p) => {
          <p>{p}</p>;
        })}
    </div>
  );
}

export default App;
