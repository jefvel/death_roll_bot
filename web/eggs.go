package main

import (
  "fmt"
  "net/http"
  "encoding/json"

  "github.com/julienschmidt/httprouter"
  "database/sql"

  _ "github.com/lib/pq"
)


type CurrencyInfo struct {
    TotalCurrency int `json:"totalCurrency"`
}

func TotalCurrency(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  sqlStatement := `SELECT sum(currency) FROM players`
  row := db.QueryRow(sqlStatement)
  total := CurrencyInfo{}
  switch err := row.Scan(&total.TotalCurrency); err {
  case sql.ErrNoRows:
	fmt.Fprintf(w, "null")
  case nil:
	s, _ := json.Marshal(total)
	w.Write(s)
  default:
	panic(err)
  }
}

