import { allRules } from '.'

describe('schema generation', () => {
    it('schema should not change', () => {
        expect(allRules).toMatchSnapshot()
    })
})
