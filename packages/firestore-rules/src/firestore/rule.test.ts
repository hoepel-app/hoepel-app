import { Rule } from './rule'

describe('Rule', () => {
    it('rule with all false', () => {
        expect(new Rule({
            comment: 'This is my comment',
            match: '/databases/{database}/documents/my-collection/{document}',
            allowRead: false,
            allowCreate: false,
            allowDelete: false,
            allowUpdate: false,
        }).toString()).toMatchSnapshot()
    })

    it('rule with all true', () => {
        expect(new Rule({
            comment: 'This is my comment',
            match: '/databases/{database}/documents/my-collection/{document}',
            allowRead: true,
            allowCreate: true,
            allowDelete: true,
            allowUpdate: true,
        }).toString()).toMatchSnapshot()
    })
    
    it('rule with permissions', () => {
        expect(new Rule({
            comment: 'This is my comment',
            match: '/databases/{database}/documents/my-collection/{document}',
            allowRead: 'request.auth.isAdmin',
            allowCreate: 'request.auth.otherThing',
            allowDelete: true,
            allowUpdate: false,
        }).toString()).toMatchSnapshot()
    })
})
