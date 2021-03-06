<!--

@module {can.Component} crud-manager <crud-manager />
@parent crud.components
@outline 3

-->

## Description

A configureable data manager component that utilizes many of the data
components to build a complete paginated display of data as well as tools for
creating, editing, and deleting data.

In addition to the components used, this component provides functionality to
create, update, display, and delete any type of data. The core property to the
crud-manager is the `view` which controls exactly how the crud-manager displays
and updates the data.

### The View Property

The `view` requires a property, `connection` which is the data model. All data displayed in
the crud manager is retrieved via the connection and any edits or deletes are
pushed back to the connection. The `connection` object is simply a `can-connect`
object, like a supermap.

### Fields

Customizing the display of each field can be done via the `view.fields` property.
This property can be a simple array of strings or more complex objects describing
how to format, filter, and display each field.

### New Object Template

To create new objects, the `view.objectTemplate` property must be provided.
This is a `can.Map` or similar object. It defines the default values
and the types of properties. The crud-manager supports the use of the define
plugin to enable this functionality.

**Note: If the `fields` property is not defined, `objectTemplate` is required.
The crud-manager falls back on this property to create fields.**

### Related Data

This component is recursive and can display child crud-managers on related data
types. The property `view.relatedViews` which contains child views and information
on how the views are related allows for this.

## Demo

@demo crud-manager/demo.html 800
