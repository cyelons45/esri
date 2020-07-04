var map, view, url, layer, graphicsLayer
require([
    "esri/Map",
    "esri/views/MapView",
    "esri/request",
    "esri/layers/MapImageLayer",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/geometry/Extent",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar"

], function(Map, MapView, esriRequest, MapImageLayer, Legend, Expand, Extent, GraphicsLayer, Graphic, Search, ScaleBar) {
    var table_temp = document.querySelector('.body_content')
    table_temp.id = 'table-attachment'
    var toc = document.querySelector('.att-table')
    var toc_content = document.querySelector('.attr_content')
    var contextMenuClassName = "context-main";
    // var contextMenuItemClassName = "context-main__item";
    // var contextMenuLinkClassName = "context-main__link";
    var contextMenuActive = "context-menu--active";
    var taskItemInContext
    var taskItemClassName = "List";
    var taskItemInContext;
    var LayerExtent = ''

    var clickCoords;
    var clickCoordsX;
    var clickCoordsY;
    var selectedResponse = ''
    var menu = document.querySelector(".context-menu");
    // var menuItems = menu.querySelectorAll(".context-main__item");
    var menuState = 0;
    var contextState = 1
    var menuWidth;
    var menuHeight;
    var menuPosition;
    var menuPositionX;
    var menuPositionY;
    var active_Item = '';
    // var active_Item2 = '';
    var getdataRes

    var windowWidth
    var windowHeight
    url_feature = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/"
    url_mixed = "https://sampleserver6.arcgisonline.com/arcgis/rest/services?f=json"

    var DEFAULT_SELECTION = ""
    var CURRENT_EXTENT = true




    function init() {

        map = new Map({
            basemap: "topo-vector"
                // basemap: "satellite"

        });

        view = new MapView({
                container: "viewDiv",
                map: map,
                center: [-110.48698391423942, 23.852698118992922], // longitude, latitude
                zoom: 3
            })
            // console.log(view.ui)
        view.ui.remove("attribution");

        // SEARCH WIDGET
        const searchWidget = new Search({
            view: view
        });

        view.ui.add(searchWidget, {
            position: "top-right",
            index: 2
        });


        // SCALEBAR WIDGET
        var scaleBar = new ScaleBar({
            view: view
        });
        // Add widget to the bottom left corner of the view
        view.ui.add(scaleBar, {
            position: "bottom-left"
        });

        // Legend
        var legend = new Legend({
            view: view
        })

        var expandLegend = new Expand({
            expandTooltip: "Show Legend",
            expanded: false,
            view: view,
            content: legend

        })

        view.ui.add(expandLegend, "bottom-right");

        graphicsLayer = new GraphicsLayer();
        // console.log(map)
        map.add(graphicsLayer, 5000);

        async function useResponse() {
            let getdata = new RequestData()
            getdata.getTOC()
            getdata.buildTOC()
                // console.log(getdata)

        }

        useResponse()

    }



    // GET DATA FOR TOC

    class RequestData {
        constructor() {
            this.initialRequest = []
            this.Layers = []

        }
        getTOC() {
                var options = {
                    query: {
                        f: "json",
                        where: '1=1',
                        outFields: '*',
                        returnGeometry: true,
                        // inSR:JSON.stringify()
                        // geometries=JSON.stringify({})
                    },
                    responseType: "json"
                }
                esriRequest(url_mixed, options).then((response) => {
                    // https://sampleserver6.arcgisonline.com/arcgis/rest/services?f=json
                    var geoJson = response.data.services;
                    this.initialRequest.push(geoJson)

                    geoJson.forEach((el, i) => {


                        if (el.type === "MapServer") {
                            layer = new MapImageLayer({
                                url: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/${el.name}/MapServer`,

                            });

                            let newPromise = new Promise((resolve, reject) => {
                                resolve(layer)
                            })
                            newPromise.then((layer) => {
                                if (layer.title != 'WorldTimeZones' && layer.title != 'Precipitation' && layer.title != "MtBaldy BaseMap") {
                                    map.add(layer, i);
                                    this.buildTOC(layer)

                                }

                            })
                        }

                    })
                });

            }
            //Build table of content
        buildTOC(layer) {

            if (layer) {
                function populateLayer(Layer, layerlist) {
                    let li = document.createElement('li')
                    li.id = Layer.id
                    li.setAttribute('_url', `${Layer.url}`)
                    li.setAttribute('serviceName', `${Layer.title}`)
                        // console.log(typeof(Layer.url))
                    li.setAttribute('class', 'List')

                    AddToLayer(Layer.fullExtent)
                    let chk = document.createElement('input')
                    chk.type = "checkbox"
                    chk.value = Layer.id
                    chk.name = `${Layer.title}_${Layer.id}`
                    chk.id = `${Layer.title}_${Layer.id}`
                    chk.layr = Layer
                        // console.log(Layer)
                        // console.log(Layer)
                        // if (Layer.visible) {
                        //     chk.checked = Layer.visible
                        // }

                    chk.addEventListener('change', e => {
                        if (chk.layr) {
                            e.target.checked ? chk.layr.visible = true : chk.layr.visible = false
                        }
                    })
                    try {
                        let label = document.createElement('label')
                        label.textContent = Layer.title
                        label.title = Layer.title
                        label.setAttribute("for", `${Layer.title}_${Layer.id}`)
                        chk.checked = false
                        Layer.visible = false
                        li.appendChild(chk)
                        li.appendChild(label)
                        layerlist.appendChild(li)
                    } catch (error) {
                        console.log(error)
                    }

                    // map.add(Layer);
                    if (Layer.sublayers != null && Layer.sublayers.items.length > 0) {

                        let ulLayer = document.createElement('ul')
                        ulLayer.setAttribute('class', 'tocUL')
                        layerlist.appendChild(ulLayer)
                        Layer.sublayers.items.forEach((el) => {
                            populateLayer(el, ulLayer)
                        })
                    }
                }
                layer.when(function() {

                    let toc = document.querySelector('.att-table')
                    let layerlist = document.createElement('ul')
                    layerlist.setAttribute('class', 'ulStyle')
                    toc.appendChild(layerlist)

                    populateLayer(layer, layerlist)
                })
            }
        }
        testFullExtent(res) {
            if (res != undefined) {
                return true
            }
            return false
        }
        testExtent(ext) {
            if (ext != undefined) {
                return true
            }
            return false
        }


        aciveResponse(active_Item) {
            // console.log(active_Item)
            var Newurls = active_Item.getAttribute('_url')
            let service = active_Item.getAttribute('serviceName')
            if (active_Item.id && active_Item.getAttribute('_url')) {
                var point = new ContextClicks()
                var options = {
                        query: {
                            f: "json",
                            where: '1=1',
                            outFields: '*',
                            returnGeometry: false,
                            resultRecordCount: '1'
                        },
                        responseType: "json"
                    }
                    // Make a request for data
                esriRequest(Newurls, options).then((response) => {
                    document.getElementById('Zoom_to_Layer').classList.remove('disabledbutton')
                    document.getElementById('Attribute_table').classList.remove('disabledbutton')
                    this.selectedResponse = response.data
                    let fullExtent = this.testFullExtent(response.data.fullExtent)
                    let Extent = this.testExtent(response.data.extent)
                    this.selectedResponseURL = Newurls
                    this.NewExtent = response.data.fullExtent || response.data.extent
                        // console.log(response.data)
                    if (fullExtent || response.data.type == "Group Layer" || response.data.type == "Annotation Layer") {
                        document.getElementById('Attribute_table').classList.add('disabledbutton')
                        point.toggleMenuOn();

                    } else if (Extent) {


                        point.toggleMenuOn();
                    }
                })
            }
        }


    }

    init()


    // CREATE BASEMAP TOGGLE WIDGET////////////////////////////////////////////////////////////////////////////////////////////////////////
    function select_basemapToggle() {
        document.querySelector('.basemap-gallery').classList.toggle('basemap-gallery-not_active')
    }

    function select_basemap(e) {
        document.querySelector('.container').innerHTML = e.target.closest('.bm-click').innerHTML

        document.querySelector('.basemap-gallery').classList.toggle('basemap-gallery-not_active')
        map.basemap = e.target.closest('.bm-click').id
    }
    (function basemapToggle() {
        document.querySelector('.bm-select').addEventListener('click', select_basemap)
        document.querySelector('.container').addEventListener('click', select_basemapToggle)
    })()





    var opts = {
        duration: 1000 // Duration of animation will be 5 seconds
    };




    let projectLayer = function(layerExtent) {
        // console.log(layerExtent)
        let url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/project"

        try {
            var options = {
                query: {
                    f: "json",
                    where: '1=1',
                    outFields: '*',
                    returnGeometry: true,
                    inSR: JSON.stringify(layerExtent.spatialReference),
                    outSR: 4326,
                    geometries: JSON.stringify({
                        "geometryType": "esriGeometryPoint",
                        "geometries": [{
                            x: layerExtent.xmin,
                            y: layerExtent.ymin
                        }, {
                            x: layerExtent.xmax,
                            y: layerExtent.ymax
                        }]

                    })
                },
                responseType: "json"
            }
            esriRequest(url, options).then((response) => {
                let fe = {}
                fe.xmin = response.data.geometries[0].x
                fe.ymin = response.data.geometries[0].y
                fe.xmax = response.data.geometries[1].x
                fe.ymax = response.data.geometries[1].y
                fe.spatialReference = 4326
                view.extent = new Extent(fe)
            })
        } catch (err) {
            console.log(err)
        }

    }





    function AddToLayer(layer) {

        try {
            if (layer) {
                let url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/project"
                var options = {
                    query: {
                        f: "json",
                        where: '1=1',
                        outFields: '*',
                        returnGeometry: true,
                        inSR: JSON.stringify(layer.spatialReference),
                        outSR: 4326,
                        geometries: JSON.stringify({
                            "geometryType": "esriGeometryPoint",
                            "geometries": [{
                                x: layer.xmin,
                                y: layer.ymin
                            }, {
                                x: layer.xmax,
                                y: layer.ymax
                            }]

                        })
                    },
                    responseType: "json"
                }
                esriRequest(url, options).then((response) => {
                    let fe = {}
                    fe.xmin = response.data.geometries[0].x
                    fe.ymin = response.data.geometries[0].y
                    fe.xmax = response.data.geometries[1].x
                    fe.ymax = response.data.geometries[1].y
                    fe.spatialReference = 4326
                    layer.fullExtent = new Extent(fe)
                })
            }
        } catch (err) {
            console.log(err)
        }


    }




    // ATTRIBUTE TABLE

    function toggleTable(e) {
        if (e.target.closest('.icon').id == 'icon-1') {
            document.querySelector('.att-table').style.display = 'block'
            document.querySelector('.att-about').style.display = 'none'
        } else if (e.target.closest('.icon').id == 'icon-2') {
            document.querySelector('.att-about').style.display = 'block'
            document.querySelector('.att-table').style.display = 'none'
        }

    }



    // CLASS FOR CONTEXT CLICKS

    class ContextClicks {
        constructor() {
            this.x = []
        }
        getPosition(e) {

            var posx = 0;
            var posy = 0;

            if (!e) var e = window.event;

            if (e.pageX || e.pageY) {
                posx = e.pageX;
                posy = e.pageY;
            } else if (e.clientX || e.clientY) {
                posx = e.clientX + toc.scrollLeft
                posy = e.clientY + toc.scrollTop
            }

            // console.log(posx, posy)
            return {
                x: posx,
                y: posy
            }
        }


        clickInsideElement(e, className) {
            var el = e.srcElement || e.target;

            if (el.classList.contains(className)) {
                return el;
            } else {
                while (el = el.parentNode) {
                    if (el.classList && el.classList.contains(className)) {
                        return el;
                    }
                }
            }

            return false;
        }

        positionMenu(e, toc, toc_content) {
            clickCoords = this.getPosition(e);
            clickCoordsX = clickCoords.x
            clickCoordsY = clickCoords.y + toc_content.scrollTop - 142
            menuWidth = menu.offsetWidth + 4;
            menuHeight = menu.offsetHeight + 4;
            windowWidth = toc.offsetWidth
            windowHeight = toc.offsetHeight
            if ((windowWidth - clickCoordsX) < menuWidth) {
                menu.style.left = windowWidth - menuWidth + "px";

            } else {
                menu.style.left = clickCoordsX + "px";
            }

            if ((windowHeight - clickCoordsY) < menuHeight) {
                menu.style.top = windowHeight - menuHeight + "px";


            } else {
                menu.style.top = clickCoordsY + "px";

            }

        }
        toggleMenuOff() {
            if (menuState !== 0) {
                menuState = 0;
                menu.classList.remove(contextMenuActive);
            }
        }

        toggleMenuOn() {
            if (menuState !== 1) {
                menuState = 1;
                menu.classList.add(contextMenuActive);
            }
        }

        hideContext() {
            menuState = 0;
            menu.classList.remove(contextMenuActive);
        }




    }


    // GEOMETRY CLASS

    class CreateGraphic {
        point(typ) {
            var point = {
                type: "point", // autocasts as new Point()
                x: typ.x,
                y: typ.y,

            };

            var markerSymbol = {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: [238, 11, 162, 0.2],
                size: 25,
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [238, 11, 162],
                    width: 4
                }
            };
            var pointGraphic = new Graphic({
                geometry: point,
                symbol: markerSymbol
            });

            graphicsLayer.add(pointGraphic);
            // pointGraphic.setAttribute('class', 'graphics')
            view.goTo(pointGraphic)

        }

        polyline(typ) {

            var polyline = {
                type: "polyline", // autocasts as new Polyline()
                paths: typ.paths
            };

            var lineSymbol = {
                type: "simple-line", // autocasts as SimpleLineSymbol()
                color: [238, 11, 162],
                width: 5
            };
            var polylineGraphic = new Graphic({
                geometry: polyline,
                symbol: lineSymbol
            });

            graphicsLayer.add(polylineGraphic);
            // polylineGraphic.setAttribute('class', 'graphics')
            view.goTo(polylineGraphic)
        }
        polygon(typ) {

            var polygon = {
                type: "polygon", // autocasts as new Polygon()
                rings: typ.rings
            };

            var fillSymbol = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: [238, 11, 162, 0.2],
                style: 'block',
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [238, 11, 162],
                    width: 6
                }
            };
            var polygonGraphic = new Graphic({
                geometry: polygon,
                symbol: fillSymbol
            });

            graphicsLayer.add(polygonGraphic);
            // polygonGraphic.setAttribute('class', 'graphics')
            view.goTo(polygonGraphic)
        }
    }



    (function toggleAttributePane() {
        $(".closen").click(function() {
            // var toc_content = document.querySelector('.attr_content')
            // var toc = document.querySelector('.att-table')
            if ($(".attribute_Table").width() != 0) {
                $(".attribute_Table").animate({ width: "0vw" }, 200)
                document.querySelector('.header_t').style.display = 'none'
                document.querySelector('.attr_content').style.display = 'none'
            } else {
                $(".attribute_Table").animate({ width: "25vw" }, 200)
                document.querySelector('.header_t').style.display = 'block'
                document.querySelector('.att_content-cover').addEventListener('click', toggleTable)
                document.querySelector('.attr_content').style.display = 'block'
                document.querySelector('.att-table').style.display = 'block'
                    // contextListener(toc, toc_content)



            }

        })
    })()



    // CONTEXT MENU CLICK///////////////////////////////////////////////////////////////////////////////////////////////
    // function contextListener(toc, toc_content) {


    $('.att-table').contextmenu(function(evt) {
        evt.preventDefault();
        getdataRes = new RequestData()
        var point = new ContextClicks()
        taskItemInContext = point.clickInsideElement(evt, taskItemClassName);
        if (taskItemInContext) {
            document.querySelectorAll('.List').forEach((el) => (el.classList.remove('List-active')))
            active_Item = evt.target.closest('.List')
            active_Item2 = evt.target.closest('.List')
            active_Item.classList.add('List-active')
                // console.log(active_Item)
            getdataRes.aciveResponse(active_Item)
                // point.toggleMenuOn();
            point.positionMenu(evt, toc, toc_content);
            // selectOption()
            // nextProps(selectedResponse)
        } else {
            taskItemInContext = null;
            point.toggleMenuOff();
        }


    });


    function setExtent() {
        view.useExtent === !CURRENT_EXTENT ? view.useExtent = CURRENT_EXTENT : view.useExtent = !CURRENT_EXTENT
            // console.log(view)
    }
    view.useExtent = CURRENT_EXTENT
    document.getElementById('useExtent').addEventListener('change', setExtent)
        // console.log(view.useExtent)
        // CLICK EVENTS
    $('.context_item').click((e) => {
            let point = new ContextClicks()
            let selectedResponseURL = getdataRes.selectedResponseURL
                // console.log(selectedResponseURL)
            let Extent = getdataRes.NewExtent
            point.hideContext()
            table_temp.innerHTML = ''
            let loader = document.createElement('div')
            loader.setAttribute('class', 'loader')

            let path = document.getElementById('path')
                // let attributeTable = document.createElement('div')
                // attributeTable.id = 'Att-Table'
            if (e.target.id === 'Attribute_table') {
                table_temp.appendChild(loader)
                showAttribute()
                if (selectedResponseURL) {

                    path ? path.innerHTML = '' : path
                    let service = active_Item.getAttribute('serviceName')
                    path.innerHTML = service
                    let urln = selectedResponseURL + '/query'

                    var options = {
                        query: {
                            f: "json",
                            where: '1=1',
                            geometry: view.useExtent ? geometry = JSON.stringify(view.extent) : geometry = undefined,
                            inSR: JSON.stringify(view.extent.spatialReference),
                            geometryType: 'esriGeometryEnvelope',
                            spatialRel: 'esriSpatialRelIntersects',
                            outFields: '*',
                            returnGeometry: true,
                            // resultRecordCount: '20'
                        },
                        responseType: "json"
                    }


                    // Make a request for data
                    esriRequest(urln, options).then((response) => {

                        LayerExtent = response.data.fullExtent
                        let table = document.createElement('table')
                        table.id = '_table'
                        let thead = document.createElement('thead')
                        table.appendChild(thead)
                        let header = document.createElement('tr')
                        header.id = 'table-head'
                        let rowItem = document.createElement('div')
                            // rowItem.id = 'oneRow'
                        thead.appendChild(header)
                        for (let i = 0; i < response.data.fields.length; i++) {

                            let column = document.createElement('th');
                            column.id = 'table_header'
                            column.textContent = response.data.fields[i].alias
                            header.appendChild(column)
                                //Loop through all features
                        }
                        // console.log(response.data)
                        let tbody = document.createElement('tbody')
                        table.appendChild(tbody)
                        for (let j = 0; j < response.data.features.length; j++) {
                            let row = document.createElement('tr')
                            row.setAttribute('class', 'oneRow')
                            row.setAttribute('url', url)
                            row.addEventListener('click', (e) => {
                                document.querySelectorAll('.oneRow').forEach((el) => (el.classList.remove('oneRow-active')))
                                row.classList.add('oneRow-active')

                                var options = {
                                        query: {
                                            f: "json",
                                            where: '1=1',
                                            objectIds: `${row.id}`,
                                            outSR: 4326,
                                            returnGeometry: true,
                                        },
                                        responseType: "json"
                                    }
                                    // Make a request for data
                                esriRequest(urln, options).then(function(response) {
                                    graphicsLayer.removeAll()
                                    let graph = new CreateGraphic()
                                    if (response.data.geometryType === 'esriGeometryPoint') {
                                        graph.point(response.data.features[0].geometry)
                                    } else if (response.data.geometryType === 'esriGeometryPolygon') {
                                        graph.polygon(response.data.features[0].geometry)
                                    } else if (response.data.geometryType === 'esriGeometryPolyline') {
                                        graph.polyline(response.data.features[0].geometry)
                                    } else {
                                        console.log('error')
                                        return
                                    }
                                })
                            })
                            tbody.appendChild(row)
                            let feature = response.data.features[j];
                            // console.log(feature)
                            for (let i = 0; i < response.data.fields.length; i++) {
                                let col = document.createElement('td');
                                col.setAttribute('class', 'table-data')
                                    // col.id = 'table-data'
                                let field = response.data.fields[i]

                                if (field.type == 'esriFieldTypeOID') {

                                }

                                if (field.type == 'esriFieldTypeDate') {
                                    let d = new Date(feature.attributes[field.name])
                                    col.textContent = d
                                } else if (field.type === 'esriFieldTypeOID') {
                                    row.id = feature.attributes[field.name]
                                    col.textContent = feature.attributes[field.name]
                                } else {
                                    col.textContent = feature.attributes[field.name]
                                }
                                row.appendChild(col)
                            }
                        }


                        table_temp.appendChild(table)
                        table_temp.removeChild(loader)


                    });
                }
                // active_Item = ''
            } else if (e.target.id === 'Zoom_to_Layer') {
                hideAttribute()
                    // console.log('heyyy')
                projectLayer(Extent)
            }





        })
        // }





    // function nextProps(selectedResponse){

    // }


    // function to display attribute atable
    function showAttribute() {
        $(".Attribute-table").animate({ height: '300px' }, 200)
        document.querySelector('.att_head').style.display = 'block'
    }

    // function to hide attribute atable
    function hideAttribute() {
        document.querySelector('.att_head').style.display = 'none'

        $(".Attribute-table").animate({ height: "0px" }, 200)
    }

    document.querySelector('.att_toggle').addEventListener('click', toggleAttributeTable)

    function toggleAttributeTable() {


        if ($(".Attribute-table").height() != 0) {
            hideAttribute()


        } else {
            showAttribute()

        }
    }








})