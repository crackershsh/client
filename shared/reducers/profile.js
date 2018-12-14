// @flow
import * as ProfileGen from '../actions/profile-gen'
import * as Types from '../constants/types/profile'
import * as Constants from '../constants/profile'
import * as Flow from '../util/flow'
import * as Validators from '../util/simple-validators'

// A simple check, the server does a fuller check
function checkBTC(address: string): boolean {
  return !!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)
}

// A simple check, the server does a fuller check
function checkZcash(address: string): boolean {
  return true // !!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)
}

function checkUsernameValid(platform: ?string, username: string): boolean {
  if (platform === 'btc') {
    return checkBTC(username)
  } else if (platform === 'zcash') {
    return checkZcash(username)
  } else {
    return true
  }
}

function cleanupUsername(platform: ?string, username: string): string {
  if (['http', 'https'].includes(platform)) {
    // Ensure that only the hostname is getting returned, with no
    // protocol, port, or path information
    return (
      username &&
      username
        .replace(/^.*?:\/\//, '') // Remove protocol information (if present)
        .replace(/:.*/, '') // Remove port information (if present)
        .replace(/\/.*/, '')
    ) // Remove path information (if present)
  }
  return username
}

const initialState = Constants.makeInitialState()

export default function(state: Types.State = initialState, action: ProfileGen.Actions): Types.State {
  switch (action.type) {
    case ProfileGen.resetStore:
      return initialState
    case ProfileGen.updatePlatform: {
      const {platform} = action.payload
      const usernameValid = checkUsernameValid(platform, state.username)
      return state.merge({
        platform,
        usernameValid,
      })
    }
    case ProfileGen.updateUsername: {
      const {username} = action.payload
      const usernameValid = checkUsernameValid(state.platform, username)
      return state.merge({usernameValid})
    }
    case ProfileGen.cleanupUsername:
      return state.merge({username: cleanupUsername(state.platform, state.username)})
    case ProfileGen.revokeFinish:
      return state.merge({revokeError: action.error ? action.payload.error : ''})
    case ProfileGen.updateProofText:
      return state.merge({proofText: action.payload.proof})
    case ProfileGen.updateProofStatus:
      return state.merge({
        proofFound: action.payload.found,
        proofStatus: action.payload.status,
      })
    case ProfileGen.updateErrorText:
      const {errorCode, errorText} = action.payload
      return state.merge({errorCode, errorText})
    case ProfileGen.updateSigID:
      return state.merge({sigID: action.payload.sigID})
    case ProfileGen.updatePgpInfo:
      if (action.error) {
        const valid1 = Validators.isValidEmail(state.pgpEmail1)
        const valid2 = Validators.isValidEmail(state.pgpEmail2)
        const valid3 = Validators.isValidEmail(state.pgpEmail3)
        return state.merge({
          pgpErrorEmail1: !!valid1,
          pgpErrorEmail2: !!valid2,
          pgpErrorEmail3: !!valid3,
          pgpErrorText: Validators.isValidName(state.pgpFullName) || valid1 || valid2 || valid3,
        })
      }
      return state.merge(action.payload)
    case ProfileGen.updatePgpPublicKey:
      return state.merge({pgpPublicKey: action.payload.publicKey})
    // Saga only actions
    case ProfileGen.addProof:
    case ProfileGen.backToProfile:
    case ProfileGen.cancelAddProof:
    case ProfileGen.cancelPgpGen:
    case ProfileGen.checkProof:
    case ProfileGen.dropPgp:
    case ProfileGen.editProfile:
    case ProfileGen.finishRevoking:
    case ProfileGen.finishedWithKeyGen:
    case ProfileGen.generatePgp:
    case ProfileGen.onClickAvatar:
    case ProfileGen.onClickFollowers:
    case ProfileGen.onClickFollowing:
    case ProfileGen.outputInstructionsActionLink:
    case ProfileGen.showUserProfile:
    case ProfileGen.submitBTCAddress:
    case ProfileGen.submitRevokeProof:
    case ProfileGen.submitUsername:
    case ProfileGen.submitZcashAddress:
    case ProfileGen.uploadAvatar:
      return state
    default:
      Flow.ifFlowComplainsAboutThisFunctionYouHaventHandledAllCasesInASwitch(action)
      return state
  }
}
