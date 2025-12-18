module Main

%default total

data TaskStatus = Todo | InProgress | Done

data Task : Type where
  MkTask : Int -> String -> TaskStatus -> Task

data TaskBoard : Type where
  MkBoard : Task -> Task -> Task -> TaskBoard

data Summary : Type where
  MkSummary : Nat -> Nat -> Nat -> Summary

renderStatus : TaskStatus -> String
renderStatus Todo = "todo"
renderStatus InProgress = "in-progress"
renderStatus Done = "done"

renderTask : Task -> String
renderTask (MkTask ident description status) =
  "#" ++ show ident ++ " (" ++ renderStatus status ++ "): " ++ description

taskSetStatus : Task -> TaskStatus -> Task
taskSetStatus (MkTask ident description _) newStatus =
  MkTask ident description newStatus

summarizeTask : Task -> Summary
summarizeTask (MkTask _ _ Todo) = MkSummary 1 0 0
summarizeTask (MkTask _ _ InProgress) = MkSummary 0 1 0
summarizeTask (MkTask _ _ Done) = MkSummary 0 0 1

combine : Summary -> Summary -> Summary
combine (MkSummary a b c) (MkSummary x y z) =
  MkSummary (a + x) (b + y) (c + z)

summarizeBoard : TaskBoard -> Summary
summarizeBoard (MkBoard t1 t2 t3) =
  combine (summarizeTask t1) (combine (summarizeTask t2) (summarizeTask t3))

setInProgress : TaskBoard -> Int -> TaskBoard
setInProgress (MkBoard t1 t2 t3) ident =
  MkBoard (update t1) (update t2) (update t3)
  where
    update : Task -> Task
    update task@(MkTask tid _ _) =
      if tid == ident then taskSetStatus task InProgress else task

complete : TaskBoard -> Int -> TaskBoard
complete (MkBoard t1 t2 t3) ident =
  MkBoard (finish t1) (finish t2) (finish t3)
  where
    finish : Task -> Task
    finish task@(MkTask tid _ _) =
      if tid == ident then taskSetStatus task Done else task

renderSummary : Summary -> String
renderSummary (MkSummary todo doing done) =
  "todo=" ++ show todo ++
  ", in-progress=" ++ show doing ++
  ", done=" ++ show done

printBoard : TaskBoard -> IO ()
printBoard (MkBoard t1 t2 t3) = do
  putStrLn (renderTask t1)
  putStrLn (renderTask t2)
  putStrLn (renderTask t3)

main : IO ()
main = do
  let board =
        MkBoard
          (MkTask 1 "Write documentation" Todo)
          (MkTask 2 "Implement domain logic" InProgress)
          (MkTask 3 "Add coverage tooling" Todo)

  putStrLn "== Task board =="
  printBoard board

  let progressed = setInProgress board 1
  let completed = complete progressed 2
  let summary = summarizeBoard completed

  putStrLn ""
  putStrLn "== Updated board =="
  printBoard completed

  putStrLn ""
  putStrLn $ "Summary: " ++ renderSummary summary
