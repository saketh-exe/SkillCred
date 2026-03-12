import React, { createContext, useContext, useState } from 'react'

interface QuizContextValue {
  quizActive: boolean
  setQuizActive: (v: boolean) => void
}

const QuizContext = createContext<QuizContextValue>({ quizActive: false, setQuizActive: () => {} })

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [quizActive, setQuizActive] = useState(false)
  return <QuizContext.Provider value={{ quizActive, setQuizActive }}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  return useContext(QuizContext)
}
