package main

import (
  "fmt"
  "net/http"
  "log"
  "os"
  "path"

  "github.com/julienschmidt/httprouter"
  "database/sql"

  _ "github.com/lib/pq"
)

const (
  host     = "0.0.0.0"
  port     = 5432
  user     = "postgres"
  dbname   = "deathroll"
)


var db *sql.DB
func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
  fmt.Fprint(w, "Welcome!\n")
}

func initDB() {
  psqlInfo := fmt.Sprintf("host=%s port=%d user=%s "+
  "password=%s dbname=%s sslmode=disable",
  host, port, user, nil, dbname)
  var err error
  db, err = sql.Open("postgres", psqlInfo)
  if err != nil {
    panic(err)
  }

  err = db.Ping()
  if err != nil {
    panic(err)
  }
}

type Logger struct {
  handler http.Handler
}

func (l *Logger) ServeHTTP(w http.ResponseWriter, r *http.Request) {
  // fmt.Println(r.Method, r.URL.Path)
  l.handler.ServeHTTP(w, r)
}

const staticPath = "deathroll-site/build"

type indexWrapper struct {
  assets http.FileSystem
}

func (i *indexWrapper) Open(name string) (http.File, error) {
  ret, err := i.assets.Open(name)
  if !os.IsNotExist(err) || path.Ext(name) != "" {
    return ret, err
  }
  return i.assets.Open("/index.html")
}

func main() {
  initDB()
  defer db.Close()

  router := httprouter.New()
  assets := http.Dir(staticPath)
  router.NotFound = http.FileServer(&indexWrapper{assets})

  router.GET("/api/town", ListTowns)
  router.GET("/api/town/:id", TownInfo)

  router.GET("/api/player", ListPlayers)
  router.GET("/api/player/:id", PlayerInfo)

  router.GET("/api/top/topegg", Top10Players)

  router.GET("/api/eggs/total", TotalCurrency)

  fmt.Println("Deathroll API up")

  log.Fatal(http.ListenAndServe(":4200", &Logger{router}))
}
