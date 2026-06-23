import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * zodResolver infers a schema's INPUT type, but our forms are typed with the
 * schema's OUTPUT type (z.infer). When a schema uses .default()/.transform()/
 * .optional() the two differ, which breaks useForm's generics (Resolver, Control
 * and SubmitHandler all stop matching). This wrapper pins the resolver to the
 * form's output type. Runtime behavior is identical to calling zodResolver directly.
 */
export function formResolver<T extends FieldValues>(schema: ZodType): Resolver<T> {
  return zodResolver(schema as never) as unknown as Resolver<T>
}
