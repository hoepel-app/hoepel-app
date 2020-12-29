import { CommandResult } from '@hoepel.app/ddd-library'

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toBeRejected(): CustomMatcherResult
      toBeRejectedWithReason(expectedReason: string): CustomMatcherResult
      toBeAccepted(): CustomMatcherResult
    }
  }
}

expect.extend({
  toBeRejected: (commandResult: CommandResult) => ({
    message: () => {
      if (commandResult == null) {
        return `expected that command was rejected, actual result: command is ${commandResult}`
      } else {
        return `expected that command was rejected, actual result: ${commandResult.status}`
      }
    },
    pass: commandResult != null && commandResult.status === 'rejected',
  }),
  toBeRejectedWithReason: (
    commandResult: CommandResult,
    expectedReason: string
  ) => ({
    message: () => {
      if (commandResult == null) {
        return `expected that command was rejected, actual result: command is ${commandResult}`
      } else if (commandResult.status !== 'rejected') {
        return `expected that command was rejected, actual result: ${commandResult.status}`
      } else if (commandResult.reason == null) {
        return `expected that command was rejected with reason '${expectedReason}', but was rejected without reason`
      } else {
        return `expected that command was rejected with reason '${expectedReason}', but was rejected with reason '${commandResult.reason}'`
      }
    },
    pass:
      commandResult != null &&
      commandResult.status === 'rejected' &&
      commandResult.reason === expectedReason,
  }),
  toBeAccepted: (commandResult: CommandResult) => ({
    message: () => {
      if (commandResult == null) {
        return `expected that command was accepted, actual result: command is ${commandResult}`
      } else {
        return `expected that command was accepted, actual result: ${commandResult.status}`
      }
    },
    pass: commandResult != null && commandResult.status === 'accepted',
  }),
})
