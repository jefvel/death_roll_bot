package main

import (
  "fmt"
  "net/http"
  "encoding/json"

  "github.com/julienschmidt/httprouter"
  "database/sql"

  _ "github.com/lib/pq"
)

type Town struct {
  Id string `json:"id"`
  Name string `json:"name"`
  X int `json:"x"`
  Y int `json:"y"`
  Currency int `json:"currency"`
}

type TownList struct {
	Towns []Town `json:"towns"`
}

func getTown(id string) (*Town, error) {

  sqlStatement := `SELECT id, name, currency, x, y FROM towns WHERE id=$1;`
  t := Town{}

  row := db.QueryRow(sqlStatement, id)

  switch err := row.Scan(&t.Id, &t.Name, &t.Currency, &t.X, &t.Y); err {
  case nil:
    return &t, nil
  default:
    return nil, err
  }
}

func TownInfo(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  id := ps.ByName("id")
  town, err := getTown(id)

  switch err {
  case sql.ErrNoRows:
	fmt.Fprintf(w, "null")
  case nil:
	s, _ := json.Marshal(town)
	w.Write(s)
  default:
	panic(err)
  }
}

func ListTowns(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  sqlStatement := `SELECT id, name, currency, x, y FROM towns;`
  towns := TownList{}

  rows, err := db.Query(sqlStatement)
  if err != nil {
	return
  }

  for rows.Next() {
	t := Town{}
	switch err := rows.Scan(&t.Id, &t.Name, &t.Currency, &t.X, &t.Y); err {
	case sql.ErrNoRows:
	  fmt.Fprintf(w, "null")
	case nil:
	  towns.Towns = append(towns.Towns, t)
	default:
	  panic(err)
	}
  }

  s, _ := json.Marshal(towns)
  w.Write(s)
}

