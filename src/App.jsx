import { useEffect, useState } from 'react'
import './index.css'

const KEY = import.meta.env.VITE_WEATHER_API_KEY

function App() {
  const [city, setCity] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })
      },
      (geoError) => {
        console.error('Geolocation error', geoError.message)
        setError('Failed to get your location')
      },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    if (!city.trim() && !coords) {
      setWeatherData(null)
      setError(null)
      return
    }

    setLoading(true)

    async function getData() {
      const query = city.trim()
        ? city
        : `${ coords.latitude }, ${ coords.longitude }`

      try {
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${ KEY }&q=${ query }`,
          { signal, },
        )
        const data = await res.json()

        if (data.error) {
          setError(data.error.message)
          setWeatherData(null)
        } else {
          setWeatherData(data)
          setError(null)
        }

      } catch (err) {
        if (err.name === 'AbortError') return

        setError(err.message)
        setWeatherData(null)
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    getData()

    return () => {
      controller.abort()
    }
  }, [city, coords])

  function RenderError() {
    return <p>{ error }</p>
  }

  function RenderLoading() {
    return <p>Loading...</p>
  }

  function RenderWeather() {
    return (
      <div className="weather-card">
        <h2>
          { `${ weatherData?.location?.name }, ${ weatherData?.location?.country }` }
        </h2>
        <img
          src={ `https:${ weatherData?.current?.condition?.icon }` }
          alt="icon"
          className="weather-icon"
        />
        <p className="temperature">
          { Math.round(weatherData?.current?.temp_c) }C
        </p>
        <p className="condition">{ weatherData?.current?.condition?.text }</p>
        <div className="weather-details">
          <p>Humidity: { weatherData?.current?.humidity }%</p>
          <p>Wind: { weatherData?.current?.wind_kph } km/h</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="widget-container">
        <div className="weather-card-container">
          <h1 className="app-title">Weather Widget</h1>
          <div className="search-container">
            <input
              type="text"
              value={ city }
              placeholder="Enter city name"
              className="search-input"
              onChange={ (e) => setCity(e.target.value) }
            />
          </div>
        </div>
        { error && <RenderError /> }
        { loading && <RenderLoading /> }
        { (!loading && !error) && weatherData && <RenderWeather /> }
      </div>
    </div>
  )
}

export default App
