import React from 'react'
import { Alert, AlertTitle, Button, Box } from '@mui/material'

const ErrorMessage = ({ message, title = '錯誤', onRetry }) => {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            重試
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  )
}

export default ErrorMessage