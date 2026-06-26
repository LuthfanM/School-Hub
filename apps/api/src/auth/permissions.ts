import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

export const statement = {
  ...defaultStatements,
  course: ['create', 'read', 'update', 'delete', 'publish'],
  lesson: ['create', 'read', 'update', 'delete', 'publish'],
  student: ['create', 'read', 'read-own', 'update', 'delete', 'link-user'],
  enrollment: ['create', 'read', 'update', 'delete'],
  progress: ['read', 'read-own', 'create', 'update'],
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
  course: ['create', 'read', 'update', 'delete', 'publish'],
  lesson: ['create', 'read', 'update', 'delete', 'publish'],
  student: ['create', 'read', 'read-own', 'update', 'delete', 'link-user'],
  enrollment: ['create', 'read', 'update', 'delete'],
  progress: ['read', 'read-own', 'create', 'update'],
})

export const admin = ac.newRole({
  ...adminAc.statements,
  course: ['create', 'read', 'update', 'delete', 'publish'],
  lesson: ['create', 'read', 'update', 'delete', 'publish'],
  student: ['create', 'read', 'read-own', 'update', 'delete', 'link-user'],
  enrollment: ['create', 'read', 'update', 'delete'],
  progress: ['read', 'read-own', 'create', 'update'],
})

export const teacher = ac.newRole({
  ...memberAc.statements,
  course: ['create', 'read', 'update', 'delete', 'publish'],
  lesson: ['create', 'read', 'update', 'delete', 'publish'],
  student: ['create', 'read', 'read-own', 'update', 'link-user'],
  enrollment: ['create', 'read', 'update'],
  progress: ['read', 'read-own', 'create', 'update'],
})

export const student = ac.newRole({
  ...memberAc.statements,
  course: ['read'],
  lesson: ['read'],
  student: ['read-own'],
  enrollment: ['read'],
  progress: ['read-own', 'create'],
})
