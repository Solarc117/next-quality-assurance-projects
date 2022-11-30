import React from 'react'
import Header from '../../components/header'
import MetricImperial from '../../components/metric'
import Footer from '../../components/footer'

export default function MetricImperialPage() {
  return (
    <>
      <Header currentPath={'/metric-imperial'} />
      <hr />
      <MetricImperial />
      <hr />
      <Footer />
    </>
  )
}
