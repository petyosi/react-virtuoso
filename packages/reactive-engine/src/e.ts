import * as combinators from './combinators'
import * as nodeUtils from './nodeUtils'
import * as operators from './operators'

export const e = {
  ...combinators,
  ...operators,
  ...nodeUtils,
}
