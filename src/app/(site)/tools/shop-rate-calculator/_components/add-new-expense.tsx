"use client";

import type { Dispatch, SetStateAction } from "react";
import React, { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";

import { NewExpense } from "./form/new-expense";

type ExpenseDetail = {
  index: number;
  name: string;
  price: string;
};

type Props = {
  handleCost: Dispatch<SetStateAction<number>>;
};

export const AddNewExpenses = ({ handleCost }: Props) => {
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([]);

  const calculateCost = useCallback((costs: ExpenseDetail[]) => {
    handleCost(
      [...costs].reduce((acc, current) => {
        return acc + parseFloat(`${current.price || 0}`);
      }, 0),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNewRow = () => {
    setExpenseDetails((prevState) => [
      ...prevState,
      {
        index: Math.random(),
        name: "",
        price: "",
      },
    ]);
  };

  const clickOnDelete = (record: ExpenseDetail) => {
    const newExpenseDetails = expenseDetails.filter((r) => r !== record);
    calculateCost(newExpenseDetails);
    setExpenseDetails(newExpenseDetails);
  };

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
            console.log(e);
          }}
        />
      </form>
    </>
  );
};
