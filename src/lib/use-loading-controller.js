import { useEffect, useState } from 'react'

const useLoadingController = (...deps) => {
    const [isLoading, setIsLoading] = useState(true)
        , [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        if (isLoading) {
            const intervalId = setInterval(() => {
                if (isFinished) {
                    setIsLoading(false)
                }
            }, 1000)

            return () => clearInterval(intervalId)
        }
    }, [isLoading, isFinished, ...deps])

    return [isLoading, setIsLoading, setIsFinished]
}

export default useLoadingController