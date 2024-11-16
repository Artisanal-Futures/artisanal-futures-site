'use client'

import type { Dispatch, FC, SetStateAction } from 'react'
import React, { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import NewExpense from './form/new-expense'

type ExpenseDetail = {
  index: number
  name: string
  price: string
}

interface Props {
  handleCost: Dispatch<SetStateAction<number>>
}

const AddNewExpenses: FC<Props> = ({ handleCost }) => {
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([])

  const calculateCost = useCallback((costs: ExpenseDetail[]) => {
    handleCost(
      [...costs].reduce((acc, current) => {
        return acc + parseFloat(`${current.price || 0}`)
      }, 0),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // const handleStateChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   console.log(e);
  //   const target = e.target;
  //   if (["name", "price"].includes(target.name)) {
  //     const newExpenseDetails = [...expenseDetails];
  //     const id = Number(target.dataset.id);
  //     if (!isNaN(id)) {
  //       newExpenseDetails[id] = {
  //         ...newExpenseDetails[id],
  //         [target.name]: target.value,
  //       };
  //       calculateCost(newExpenseDetails); // Calculate cost with newExpenseDetails
  //       setExpenseDetails(newExpenseDetails);
  //     }
  //   }
  // };

  const addNewRow = () => {
    setExpenseDetails((prevState) => [
      ...prevState,
      {
        index: Math.random(),
        name: '',
        price: '',
      },
    ])
  }

  const clickOnDelete = (record: ExpenseDetail) => {
    const newExpenseDetails = expenseDetails.filter((r) => r !== record)
    calculateCost(newExpenseDetails)
    setExpenseDetails(newExpenseDetails)
  }

  return (
    <>
      <section className="flex w-full flex-row items-center justify-between gap-6 py-4">
        <p className="inline-flex w-full items-center justify-end text-right font-semibold">
          Additional Charges
        </p>
        <Button onClick={addNewRow}>
          <Plus />
        </Button>
      </section>

      <form>
        <NewExpense
          deleteCost={clickOnDelete}
          expenseDetails={expenseDetails}
          handleChange={(e) => {
            console.log(e)
          }}
        />
      </form>
    </>
  )
}

export default AddNewExpenses
