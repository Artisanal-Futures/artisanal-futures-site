"use client";

import type { ChangeEvent } from "react";
import { Trash } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { EditableLabel } from "./editable-label";

type ExpenseDetail = {
  index: number;
  name: string;
  price: string;
};

type Props = {
  expenseDetails: ExpenseDetail[];
  deleteCost: (record: ExpenseDetail) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};
export const NewExpense = ({
  expenseDetails,
  deleteCost,
  handleChange,
}: Props) => {
  return expenseDetails.map((val, idx) => {
    const name = `name-${idx}`;
    const price = `price-${idx}`;
    return (
      <div className="form-row" key={val.index}>
        <span id={name} data-id={idx} className="w-6/12">
          <EditableLabel />
        </span>
        <Input
          type="number"
          placeholder={`e.g  $59.99`}
          id={price}
          name="price"
          data-id={idx}
          onChange={handleChange}
        />
        <Button onClick={() => deleteCost(val)}>
          <Trash color="text-slate-300" />
        </Button>
      </div>
    );
  });
};
