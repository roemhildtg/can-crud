@typedef {TableButtonObject} crud.types.TableButtonObject TableButtonObject
@parent crud.types
@option {String} title The title to display on the button hover
@option {String} iconClass The class to use for the button icon
@option {String} eventName The event to dispatch when the button is clicked. This allows developers to bind functions to custom events, like `(eventName)="functionName"`

@description
Used by the list-table component to provide custom interactivity with each object or row.
