"use client";

import type { FC } from "react";
import { Fragment, useState } from "react";
import { ChevronUp } from "lucide-react";

import { Dialog, Disclosure, Transition } from "@headlessui/react";

import type { Product } from "~/types/product";

type Props = {
  product: Product;
  children: React.ReactNode;
};

export const ProductDetails: FC<Props> = ({ children, product }) => {
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <div onClick={openModal}>{children}</div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-3xl font-medium capitalize leading-6 text-gray-900"
                  >
                    {product.name}
                  </Dialog.Title>

                  <section className="mt-5 flex gap-4">
                    <div>
                      <p className="text-lg text-gray-500">
                        {product.description || "No description available."}
                      </p>

                      <Disclosure>
                        {({ open }) => (
                          <>
                            <Disclosure.Button className="mt-5 flex w-full justify-between rounded-lg bg-indigo-100 px-4 py-2 text-left text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                              <span>Product Attributes</span>
                              <ChevronUp
                                className={`${
                                  open ? "rotate-180 transform" : ""
                                } h-5 w-5 text-indigo-500`}
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
                              <ul className="list-disc px-4">
                                {product.attributeTags.map((attribute) => (
                                  <li key={attribute} className="capitalize">
                                    {attribute}
                                  </li>
                                ))}
                              </ul>
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl ?? "/img/background-fallback.jpg"}
                      alt={`Image of ${product.name}`}
                      className="aspect-square w-5/12 object-contain p-3 shadow"
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null; // prevents looping
                        currentTarget.src = "/img/background-fallback.jpg";
                      }}
                    />
                  </section>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
