import type { LatLngExpression, Map } from 'leaflet'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import L from 'leaflet'

import type { Coordinates } from '~/app/tools/solidarity-pathways/_validators/types'
import { getCurrentLocation } from '~/app/tools/solidarity-pathways/_utils/get-current-location'
import useInterval from '~/hooks/use-interval'
import { useDriverVehicleBundles } from './drivers/use-driver-vehicle-bundles'
import { useClientJobBundles } from './jobs/use-client-job-bundles'
import { useOptimizedRoutePlan } from './optimized-data/use-optimized-route-plan'
import { useSolidarityState } from './optimized-data/use-solidarity-state'

type TUseMapProps = {
  mapRef: Map
  currentLocation?: Partial<GeolocationCoordinates>
  trackingEnabled?: boolean
  driverEnabled?: boolean
  constantUserTracking?: boolean
}

const useMap = ({
  mapRef,

  driverEnabled = false,
  constantUserTracking = false,
}: TUseMapProps) => {
  const [initial, setInitial] = useState(true)

  const [constantTracking, setConstantTracking] = useState(false)

  const [status, setStatus] = useState<'idle' | 'active'>('idle')

  const driverBundles = useDriverVehicleBundles()
  const jobs = useClientJobBundles()

  const { pathId } = useSolidarityState()

  const optimizedRoutePlan = useOptimizedRoutePlan()

  useInterval(
    () => {
      if (
        !constantUserTracking &&
        currentLocation.latitude === 0 &&
        currentLocation.longitude === 0
      )
        return
      console.log(currentLocation)
      getCurrentLocation(setCurrentLocation)
      if (pathId && currentLocation)
        void axios.post('/api/routing/update-user-location', {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          pathId: pathId,
        })
    },
    status === 'active' ? 1000 : 5000,
  )

  const [currentLocation, setCurrentLocation] = useState<
    Partial<GeolocationCoordinates>
  >({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
  })

  const flyTo = useCallback(
    (coordinates: Coordinates, zoom: number) => {
      mapRef.flyTo([coordinates.latitude, coordinates.longitude], zoom)
    },
    [mapRef],
  )

  const flyToCurrentLocation = () => {
    if (currentLocation)
      flyTo(
        {
          latitude: currentLocation.latitude!,
          longitude: currentLocation.longitude!,
        },
        15,
      )
  }

  const toggleConstantTracking = () => {
    if (pathId && currentLocation.latitude && currentLocation.longitude) {
      setStatus((status) => (status === 'active' ? 'idle' : 'active'))
      setConstantTracking(!constantTracking)
    }
  }

  const expandViewToFit = useCallback(() => {
    if (
      ((jobs.data && jobs.data.length > 0) ||
        (driverBundles && driverBundles.data.length > 0)) &&
      mapRef
    ) {
      const driverBounds = pathId
        ? optimizedRoutePlan.mapCoordinates.driver
        : driverBundles.data.map(
            (driver) =>
              [
                driver.vehicle.startAddress.latitude,
                driver.vehicle.startAddress.longitude,
              ] as LatLngExpression,
          )
      const locationBounds = pathId
        ? optimizedRoutePlan.mapCoordinates.jobs
        : jobs.data.map(
            (location) =>
              [
                location.job.address.latitude,
                location.job.address.longitude,
              ] as LatLngExpression,
          )
      const bounds = L.latLngBounds([...driverBounds, ...locationBounds])

      mapRef.fitBounds(bounds)
    }
  }, [mapRef, driverBundles, jobs, optimizedRoutePlan, pathId])

  useEffect(() => {
    if (constantUserTracking) getCurrentLocation(setCurrentLocation)
  }, [driverEnabled, constantUserTracking, status])

  useEffect(() => {
    if (driverBundles.active && mapRef)
      flyTo(driverBundles.active.vehicle.startAddress, 15)
  }, [driverBundles.active, mapRef, flyTo])

  useEffect(() => {
    if (jobs.active && mapRef) flyTo(jobs.active.job.address, 15)
  }, [jobs.active, mapRef, flyTo])

  useEffect(() => {
    if (initial && mapRef && driverBundles.data && jobs.data) {
      expandViewToFit()
      setInitial(false)
    }
  }, [expandViewToFit, mapRef, driverBundles.data, jobs.data, initial])

  return {
    expandViewToFit,
    flyTo,
    currentLocation,
    flyToCurrentLocation,
    toggleConstantTracking,
    constantTracking,
  }
}

export default useMap
