export const wrappedInstance = Symbol('Wrapped instance')

export default function makeWrapperClass(baseClass) {
  // Super simple function which takes a base class and returns a completely
  // new class whose prototype contains "proxy" functions which apply on an
  // instance of the base class. Handy for usage with Babel, where you can't
  // extend native classes like Map and Set.

  const wrapperClass = function(...args) {
    this[wrappedInstance] = Reflect.construct(baseClass, args)
  }

  const baseProto = baseClass.prototype
  const wrapperProto = wrapperClass.prototype

  for (const key of Reflect.ownKeys(baseProto)) {
    const baseDescriptor = Object.getOwnPropertyDescriptor(baseProto, key)
    const wrapperDescriptor = {
      configurable: baseDescriptor.configurable,
      enumerable: baseDescriptor.enumerable
    }

    if ('value' in baseDescriptor) {
      const value = Reflect.get(baseProto, key)

      if (value && value instanceof Function) {
        wrapperDescriptor.value = function(...args) {
          value.apply(this[wrappedInstance], args)
        }
      } else {
        wrapperDescriptor.value = value
      }
    }

    if ('get' in baseDescriptor) {
      wrapperDescriptor.get = function() {
        return Reflect.get(this[wrapperInstance], key)
      }
    }

    if ('set' in baseDescriptor) {
      wrapperDescriptor.set = function(newValue) {
        return Reflect.set(this[wrapperInstance], key, newValue)
      }
    }

    Object.defineProperty(wrapperProto, key, wrapperDescriptor)
  }

  let name = 'Wrapper'
  if (baseClass.name) {
    name += ' of ' + baseClass.name
  }
  Object.defineProperty(wrapperClass, 'name', { value: name })

  return wrapperClass
}
