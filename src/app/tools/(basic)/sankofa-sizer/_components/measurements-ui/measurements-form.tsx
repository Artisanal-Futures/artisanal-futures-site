'use client'

import { toastService } from '@dreamwalker-studios/toasts'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button, buttonVariants } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { cn } from '~/utils/styles'
import { useSizerStore } from '../../_hooks/use-sizer'
import { bartol_et_al_measurements } from '../../_utils/sizer'

const weightInKg = 87
const heightInMeters = 1.83
// const to_inch = () => {
//   return 2.53;
// }; // cm -> inch

// const shoulderToWrist = bartol_to_part["Shoulder to wrist (arm)"];
// const biceps = bartol_to_part.biceps;
// const wristWidth = bartol_to_part["Wrist width"];

const formSchema = z.object({
  heightInMeters: z.number(),
  weightInKg: z.number(),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select a gender.',
  }),
})

type BodyMeasurementValues = z.infer<typeof formSchema>

const MeasurementsForm = () => {
  const { updateValue, collectedMeasurements } = useSizerStore((store) => store)

  function handleClick() {
    const bartol = bartol_et_al_measurements(heightInMeters, weightInKg)

    if (!bartol) return

    // const newValues = [
    //   { length: (shoulderToWrist(bartol) ?? 0) / to_inch() },
    //   { length: (biceps(bartol) ?? 0) / to_inch() },
    //   { length: (wristWidth(bartol) ?? 0) / to_inch() },
    // ];

    // updateParts(newValues as Partial<Part>[]);
    // console.log(newValues, parts);
  }

  const form = useForm<BodyMeasurementValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heightInMeters: collectedMeasurements.height,
      weightInKg: collectedMeasurements.weight,
      gender: collectedMeasurements.gender,
    },
  })
  function onSubmit(data: BodyMeasurementValues) {
    updateValue('collectedMeasurements', {
      height: data.heightInMeters,
      weight: data.weightInKg,
      gender: data.gender,
      system: 'metric',
    })

    toastService.feedback({
      object: data,
    })
  }

  return (
    <Form {...form}>
      <form
        className="my-5 flex flex-col gap-y-3 bg-white text-black"
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      >
        <FormField
          control={form.control}
          name="heightInMeters"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>height in meters</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 87"
                  {...field}
                  type="number"
                  onChange={(e) => {
                    form.setValue(`heightInMeters`, parseInt(e.target.value))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />{' '}
        <FormField
          control={form.control}
          name="weightInKg"
          render={({ field }) => (
            <FormItem className="col-span-full">
              <FormLabel>Weight in KG</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 87"
                  {...field}
                  type="number"
                  onChange={(e) => {
                    form.setValue(`weightInKg`, parseInt(e.target.value))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />{' '}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <div className="relative w-max">
                <FormControl>
                  <select
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-[200px] appearance-none bg-transparent font-normal',
                    )}
                    {...field}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </FormControl>
                <ChevronDownIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
              </div>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button onClick={handleClick} type="submit">
          Add Measurement Rulers
        </Button>
      </form>{' '}
    </Form>
  )
}

export default MeasurementsForm
