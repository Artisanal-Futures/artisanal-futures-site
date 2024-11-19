'use client'

import type { FC } from 'react'
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

import type { Product } from '~/app/(site)/products/_validators/types'
import { ProductCard } from '~/app/(site)/products/_components/product-card'
import { SearchBar } from '~/app/(site)/products/_components/search-bar'
import useProducts from '~/app/(site)/products/_hooks/useProducts'
import PageLoader from '~/components/ui/page-loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { AiSort } from './ai-sort'
import { ArtisanField } from './artisan-field'
import { AttributeField } from './attribute-field'

export const ProductsClient: React.FC = () => {
  const {
    products,
    attributes: principles,
    artisans,
    isLoading,
    isError,
    sortWithAI,
    isSorting,
    filterProducts,
    resetProducts,
    setFilteredProducts,
  } = useProducts()

  const [selectedPrinciples, setSelectedPrinciples] = useState<string[]>([])
  const [selectedArtisans, setSelectedArtisans] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<string>('')
  const [applicableArtisans, setApplicableArtisans] = useState<string[]>([])

  const [isAISortVisible, setIsAISortVisible] = useState<boolean>(false)

  const aiSortRef = useRef<HTMLInputElement>(null)

  const filteredPrinciples = useMemo(() => {
    return products
      ? products.reduce<string[]>((acc, product) => {
          const productPrinciples = product.principles
            .split(',')
            .map((attr) => attr.trim())
          return [...acc, ...productPrinciples]
        }, [])
      : []
  }, [products])

  useEffect(() => {
    filterProducts({
      principles: selectedPrinciples,
      the_artisan: selectedArtisans,
      query: searchTerm,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrinciples, selectedArtisans, searchTerm])

  useEffect(() => {
    const filteredArtisans = products.map((product) => product.the_artisan)

    setApplicableArtisans([...new Set(filteredArtisans)])
  }, [products])

  // Sort products based on the selected sort option
  const sortProducts = (option: string) => {
    let sorted = [...(products || [])]

    setIsAISortVisible(false)
    if (option === 'atoz') {
      sorted = sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (option === 'ztoa') {
      sorted = sorted.sort((a, b) => b.name.localeCompare(a.name))
    } else if (option === 'none') {
      sorted = sorted.sort((a, b) => (a.craftID > b.craftID ? 1 : -1))
    } else if (option === 'ai') {
      setIsAISortVisible(true)
    }

    setFilteredProducts(sorted)
  }

  const selectionMethod = {
    artisan: {
      set: setSelectedArtisans,
      get: selectedArtisans,
    },
    principle: {
      set: setSelectedPrinciples,
      get: selectedPrinciples,
    },
  }

  const handleSelect = (data: string, type: 'artisan' | 'principle') => {
    const isSelected = selectionMethod[type].get.includes(data)
    let updated = [...selectionMethod[type].get]

    if (isSelected) {
      updated = updated.filter((t) => t !== data)
    } else {
      updated.push(data)
    }
    selectionMethod[type].set(updated)
  }

  // Handle search term input
  const handleSearchTermChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchTerm(event.target.value)
  }

  // Handle sort option change
  const handleSortOptionChange = (option: string) => {
    // const option = event.target.value;
    setSortOption(option)
    sortProducts(option)
  }

  const handleSortWithAI = async () => {
    if (
      aiSortRef.current?.value === undefined ||
      aiSortRef?.current?.value === ''
    )
      return
    await sortWithAI(aiSortRef.current?.value).then((data) => {
      setFilteredProducts(data)
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setSelectedPrinciples([])
    setSelectedArtisans([])
    setSearchTerm('')
    resetProducts()
    setSortOption('')
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (isError) {
    return <>Error occurred while fetching products.</>
  }

  // const isArtisanCheckboxDisabled = (artisan: string) => {
  //   return applicableArtisans ? !applicableArtisans.includes(artisan) : false;
  // };

  // const isAttributeCheckboxDisabled = (attribute: string) => {
  //   return !filteredPrinciples.includes(attribute);
  // };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="w-full p-4 md:w-1/4">
        <Popover className="relative flex md:hidden">
          {({ open }) => (
            <>
              <Popover.Button
                className={`
                ${open ? '' : 'text-opacity-90'}
                group inline-flex w-full items-center rounded-md bg-indigo-700 px-3 py-2 text-base font-medium text-white hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
              >
                <span>Filters</span>
                <ChevronDown
                  className={`${open ? '' : 'text-opacity-70'}
                  ml-2 h-5 w-5 text-indigo-300 transition duration-150 ease-in-out group-hover:text-opacity-80`}
                  aria-hidden="true"
                />
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="   absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
                  <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="relative grid  bg-white p-7 lg:grid-cols-2">
                      <ProductFilter
                        principles={principles}
                        selectedPrinciples={selectedPrinciples}
                        filteredPrinciples={filteredPrinciples}
                        handleSelect={handleSelect}
                        artisans={artisans}
                        selectedArtisans={selectedArtisans}
                        applicableArtisans={applicableArtisans}
                        handleSearchTermChange={handleSearchTermChange}
                        searchTerm={searchTerm}
                        resetFilters={resetFilters}
                      />
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>

        <section className="hidden md:flex md:flex-col">
          <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          <ProductFilter
            principles={principles}
            selectedPrinciples={selectedPrinciples}
            filteredPrinciples={filteredPrinciples}
            handleSelect={handleSelect}
            artisans={artisans}
            selectedArtisans={selectedArtisans}
            applicableArtisans={applicableArtisans}
            handleSearchTermChange={handleSearchTermChange}
            searchTerm={searchTerm}
            resetFilters={resetFilters}
          />
        </section>
      </div>
      <div className="w-full flex-grow p-4 md:w-3/4">
        <h2>Filtered Products {products?.length}</h2>
        <div>
          <label
            htmlFor="sortOption"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Sort by:
          </label>

          <Select
            onValueChange={handleSortOptionChange}
            defaultValue={sortOption}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a verified email to display" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="atoz">A to Z</SelectItem>
              <SelectItem value="ztoa">Z to A</SelectItem>
              <SelectItem value="ai">Keyword with AI</SelectItem>
            </SelectContent>
          </Select>
          {/* 
              <select
                id="sortOption"
                value={sortOption}
                onChange={handleSortOptionChange}
              >
                <option value="none">None</option>

                <option value="atoz">A to Z</option>
                <option value="ztoa">Z to A</option>
                <option value="ai">Keyword with AI</option>
              </select> */}

          {isAISortVisible && (
            <AiSort
              fetching={isAISortVisible ? isSorting : false}
              handleOnClick={() => void handleSortWithAI()}
              ref={aiSortRef}
            />
          )}
        </div>
        <ProductGrid products={products} />
      </div>
    </div>
  )
}

interface ProductGridProps {
  products: Product[]
}
const ProductGrid: FC<ProductGridProps> = ({ products }) => {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap">
      {products !== null ? (
        products.map((product) => (
          <div
            className="flex basis-full justify-center p-4 md:basis-1/2 lg:basis-1/3"
            key={product.name}
          >
            <ProductCard {...product} key={product.craftID} />
          </div>
        ))
      ) : (
        <div>No products found.</div>
      )}
    </div>
  )
}

interface ProductFilterProps {
  principles: Array<string>
  selectedPrinciples: Array<string>
  filteredPrinciples: Array<string>
  handleSelect: (data: string, type: 'artisan' | 'principle') => void
  artisans: Array<string>
  selectedArtisans: Array<string>
  applicableArtisans: Array<string>
  handleSearchTermChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  searchTerm: string
  resetFilters: () => void
}

const ProductFilter: FC<ProductFilterProps> = ({
  handleSearchTermChange,
  searchTerm,
  principles,
  selectedPrinciples,
  filteredPrinciples,
  handleSelect,
  artisans,
  selectedArtisans,
  applicableArtisans,
  resetFilters,
}) => {
  return (
    <>
      <SearchBar handleOnSearch={handleSearchTermChange} query={searchTerm} />
      <AttributeField
        attributes={principles}
        selectedAttributes={selectedPrinciples}
        filteredAttributes={filteredPrinciples}
        handleSelect={handleSelect}
      />

      <ArtisanField
        artisans={artisans}
        selectedArtisans={selectedArtisans}
        handleSelect={handleSelect}
        applicableArtisans={applicableArtisans}
      />

      <button
        onClick={resetFilters}
        className="rounded-md bg-indigo-500 px-4 py-2 text-base font-semibold text-white hover:bg-indigo-700"
      >
        Reset Filters
      </button>
    </>
  )
}
