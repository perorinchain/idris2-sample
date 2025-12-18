module Main

import TaskTypes
import BoardData

main : IO ()
main = do
  putStrLn "== Task board =="
  printBoard board

  case lookupTask 2 board of
    Nothing =>
      putStrLn "Task #2 not found"
    Just task =>
      putStrLn $ "Task #2 is currently " ++ renderStatus (taskStatus task)

  let progressed = setInProgress board 1
  let completed = complete progressed 2
  let summary = summarizeBoard completed

  putStrLn ""
  putStrLn "== Updated board =="
  printBoard completed

  putStrLn ""
  putStrLn $ "Summary: " ++ renderSummary summary
