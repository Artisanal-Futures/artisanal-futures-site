import { CalculatorClient } from "./_components/calculator-client";

export default function ShopRateCalculator() {
  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Tools</p>
            <h1>Shop Rate Calculator</h1>
          </div>
          <p className="description">
            Calculate your shop&apos;s hourly rate based on fixed costs,
            materials, labor, and desired profit margin
          </p>
        </div>
      </header>

      <section className="site-section">
        <CalculatorClient />
      </section>
    </>
  );
}

export const metadata = {
  title: "Shop Rate Calculator",
};
