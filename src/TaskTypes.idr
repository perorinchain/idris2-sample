module TaskTypes

import Data.List
import Data.String

%default total

public export
data TaskStatus = Todo | InProgress | Done

public export
data Task : Type where
  MkTask : Int -> String -> TaskStatus -> Task

public export
taskId : Task -> Int
taskId (MkTask ident _ _) = ident

public export
taskDescription : Task -> String
taskDescription (MkTask _ description _) = description

public export
taskStatus : Task -> TaskStatus
taskStatus (MkTask _ _ status) = status

public export
taskSetStatus : Task -> TaskStatus -> Task
taskSetStatus (MkTask ident description _) newStatus =
  MkTask ident description newStatus

public export
data TaskBoard : Type where
  MkBoard : List Task -> TaskBoard

public export
boardTasks : TaskBoard -> List Task
boardTasks (MkBoard tasks) = tasks

public export
data Summary : Type where
  MkSummary : Nat -> Nat -> Nat -> Summary

public export
renderStatus : TaskStatus -> String
renderStatus Todo = "todo"
renderStatus InProgress = "in-progress"
renderStatus Done = "done"

public export
renderTask : Task -> String
renderTask task =
  "#" ++ show (taskId task)
    ++ " (" ++ renderStatus (taskStatus task) ++ "): "
    ++ taskDescription task

public export
renderSummary : Summary -> String
renderSummary (MkSummary todo doing done) =
     "todo=" ++ show todo
  ++ ", in-progress=" ++ show doing
  ++ ", done=" ++ show done

public export
summarizeTask : Task -> Summary
summarizeTask task = case taskStatus task of
  Todo => MkSummary 1 0 0
  InProgress => MkSummary 0 1 0
  Done => MkSummary 0 0 1

public export
combineSummary : Summary -> Summary -> Summary
combineSummary (MkSummary a b c) (MkSummary x y z) =
  MkSummary (a + x) (b + y) (c + z)

public export
summarizeBoard : TaskBoard -> Summary
summarizeBoard (MkBoard tasks) =
  foldl combineSummary (MkSummary 0 0 0) (map summarizeTask tasks)

public export
updateStatus : Int -> TaskStatus -> TaskBoard -> TaskBoard
updateStatus ident newStatus (MkBoard tasks) =
  MkBoard (map update tasks)
  where
    update : Task -> Task
    update task =
      if taskId task == ident
         then taskSetStatus task newStatus
         else task

public export
setInProgress : TaskBoard -> Int -> TaskBoard
setInProgress board ident = updateStatus ident InProgress board

public export
complete : TaskBoard -> Int -> TaskBoard
complete board ident = updateStatus ident Done board

public export
lookupTask : Int -> TaskBoard -> Maybe Task
lookupTask ident (MkBoard tasks) = go tasks
  where
    go : List Task -> Maybe Task
    go [] = Nothing
    go (task :: rest) =
      if taskId task == ident
         then Just task
         else go rest

public export
printBoard : TaskBoard -> IO ()
printBoard (MkBoard tasks) = printAll tasks
  where
    printAll : List Task -> IO ()
    printAll [] = pure ()
    printAll (task :: rest) = do
      putStrLn (renderTask task)
      printAll rest
