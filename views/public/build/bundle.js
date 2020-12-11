
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Card.svelte generated by Svelte v3.31.0 */

    const file = "src/Card.svelte";

    // (20:8) {:else }
    function create_else_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*value*/ ctx[1]);
    			add_location(p, file, 20, 8, 528);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:8) {:else }",
    		ctx
    	});

    	return block;
    }

    // (17:8) {#if checkURL(value)}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*value*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "portoflio image");
    			add_location(img, file, 18, 12, 461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && img.src !== (img_src_value = /*value*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(17:8) {#if checkURL(value)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div1;
    	let show_if;
    	let div1_class_value;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*checkURL, value*/ 10) show_if = !!/*checkURL*/ ctx[3](/*value*/ ctx[1]);
    		if (show_if) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(p, "class", "lead");
    			add_location(p, file, 13, 4, 270);
    			attr_dev(div0, "class", "col-12");
    			add_location(div0, file, 12, 4, 245);
    			attr_dev(div1, "class", div1_class_value = `col-12 ml-2  lead ${/*textStyle*/ ctx[2]}`);
    			add_location(div1, file, 15, 4, 314);
    			attr_dev(div2, "class", "row g-2 mb-4 gutter");
    			add_location(div2, file, 11, 0, 207);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}

    			if (dirty & /*textStyle*/ 4 && div1_class_value !== (div1_class_value = `col-12 ml-2  lead ${/*textStyle*/ ctx[2]}`)) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { title = "" } = $$props;
    	let { value = "" } = $$props;
    	let { textStyle = "text-success" } = $$props;
    	const writable_props = ["title", "value", "textStyle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("textStyle" in $$props) $$invalidate(2, textStyle = $$props.textStyle);
    	};

    	$$self.$capture_state = () => ({ title, value, textStyle, checkURL });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("textStyle" in $$props) $$invalidate(2, textStyle = $$props.textStyle);
    		if ("checkURL" in $$props) $$invalidate(3, checkURL = $$props.checkURL);
    	};

    	let checkURL;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(3, checkURL = url => {
    		return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    	});

    	return [title, value, textStyle, checkURL];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 0, value: 1, textStyle: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textStyle() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textStyle(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let nav;
    	let div1;
    	let a0;
    	let t1;
    	let button;
    	let t2;
    	let i0;
    	let t3;
    	let div0;
    	let ul;
    	let li0;
    	let a1;
    	let t5;
    	let li1;
    	let a2;
    	let t7;
    	let li2;
    	let a3;
    	let t9;
    	let header;
    	let div6;
    	let img;
    	let img_src_value;
    	let t10;
    	let h1;
    	let t11_value = /*row*/ ctx[0]("whatisyourname") + "";
    	let t11;
    	let t12;
    	let div5;
    	let div2;
    	let t13;
    	let div3;
    	let i1;
    	let t14;
    	let div4;
    	let t15;
    	let p0;
    	let t17;
    	let section0;
    	let div11;
    	let h20;
    	let t19;
    	let div10;
    	let div7;
    	let t20;
    	let div8;
    	let i2;
    	let t21;
    	let div9;
    	let t22;
    	let card0;
    	let t23;
    	let card1;
    	let t24;
    	let card2;
    	let t25;
    	let card3;
    	let t26;
    	let card4;
    	let t27;
    	let card5;
    	let t28;
    	let card6;
    	let t29;
    	let card7;
    	let t30;
    	let card8;
    	let t31;
    	let card9;
    	let t32;
    	let card10;
    	let t33;
    	let card11;
    	let t34;
    	let card12;
    	let t35;
    	let card13;
    	let t36;
    	let section1;
    	let div16;
    	let h21;
    	let t38;
    	let div15;
    	let div12;
    	let t39;
    	let div13;
    	let i3;
    	let t40;
    	let div14;
    	let t41;
    	let card14;
    	let t42;
    	let card15;
    	let t43;
    	let section2;
    	let div21;
    	let h22;
    	let t45;
    	let div20;
    	let div17;
    	let t46;
    	let div18;
    	let i4;
    	let t47;
    	let div19;
    	let t48;
    	let card16;
    	let t49;
    	let card17;
    	let t50;
    	let card18;
    	let t51;
    	let card19;
    	let t52;
    	let card20;
    	let t53;
    	let card21;
    	let t54;
    	let card22;
    	let t55;
    	let card23;
    	let t56;
    	let card24;
    	let t57;
    	let card25;
    	let t58;
    	let footer;
    	let div25;
    	let div24;
    	let div22;
    	let h40;
    	let t60;
    	let p1;
    	let t61;
    	let br;
    	let t62;
    	let t63;
    	let div23;
    	let h41;
    	let t65;
    	let a4;
    	let i5;
    	let t66;
    	let a5;
    	let i6;
    	let t67;
    	let a6;
    	let i7;
    	let t68;
    	let a7;
    	let i8;
    	let t69;
    	let div27;
    	let div26;
    	let small;
    	let t71;
    	let div28;
    	let a8;
    	let i9;
    	let current;

    	card0 = new Card({
    			props: {
    				title: "What is your favourite communication method?",
    				value: /*row*/ ctx[0]("whatisyourfavouritecommunicationmethod")
    			},
    			$$inline: true
    		});

    	card1 = new Card({
    			props: {
    				title: "How do you like to receive feedback?",
    				value: /*row*/ ctx[0]("howdoyouliketoreceivefeedback")
    			},
    			$$inline: true
    		});

    	card2 = new Card({
    			props: {
    				title: "When do you do your best work?",
    				value: /*row*/ ctx[0]("whendoyoudoyourbestwork")
    			},
    			$$inline: true
    		});

    	card3 = new Card({
    			props: {
    				title: "How do you learn best?",
    				value: /*row*/ ctx[0]("howdoyoulearnbest")
    			},
    			$$inline: true
    		});

    	card4 = new Card({
    			props: {
    				title: "What are your strengths?",
    				value: /*row*/ ctx[0]("whatareyourstrengths")
    			},
    			$$inline: true
    		});

    	card5 = new Card({
    			props: {
    				title: "What are your weaknesses?",
    				value: /*row*/ ctx[0]("whatareyourweaknesses")
    			},
    			$$inline: true
    		});

    	card6 = new Card({
    			props: {
    				title: "Which technology stack are you strongest with?",
    				value: /*row*/ ctx[0]("whichtechnologystackareyoustrongestwith")
    			},
    			$$inline: true
    		});

    	card7 = new Card({
    			props: {
    				title: "What do you struggle with?",
    				value: /*row*/ ctx[0]("whatdoyoustrugglewith")
    			},
    			$$inline: true
    		});

    	card8 = new Card({
    			props: {
    				title: "What do you find frustrating in a work environment?",
    				value: /*row*/ ctx[0]("whatdoyoufindfrustratinginaworkenvironment")
    			},
    			$$inline: true
    		});

    	card9 = new Card({
    			props: {
    				title: "What computer OS do you like?",
    				value: /*row*/ ctx[0]("whatcomputerosdoyoulike")
    			},
    			$$inline: true
    		});

    	card10 = new Card({
    			props: {
    				title: "What is your favourite code editing tool?",
    				value: /*row*/ ctx[0]("whatisyourfavouritecodeeditingtool")
    			},
    			$$inline: true
    		});

    	card11 = new Card({
    			props: {
    				title: "If you would like, share some links to your social media accounts (personal blog, etc)",
    				value: /*row*/ ctx[0]("ifyouwouldlikesharesomelinkstoyoursocialmediaaccountspersonalblogetc")
    			},
    			$$inline: true
    		});

    	card12 = new Card({
    			props: {
    				title: "Would you say you are more introverted or extroverted?",
    				value: /*row*/ ctx[0]("wouldyousayyouaremoreintrovertedorextroverted")
    			},
    			$$inline: true
    		});

    	card13 = new Card({
    			props: {
    				title: "What do you enjoy doing after work? ",
    				value: /*row*/ ctx[0]("doyouhaveanypetswhatkind")
    			},
    			$$inline: true
    		});

    	card14 = new Card({
    			props: {
    				title: "What do you prefer to be called?",
    				value: /*row*/ ctx[0]("whatdoyouprefertobecalled"),
    				textStyle: "text-warning"
    			},
    			$$inline: true
    		});

    	card15 = new Card({
    			props: {
    				title: "Do you prefer iphone or android?",
    				value: /*row*/ ctx[0]("doyoupreferiphoneorandroid"),
    				textStyle: "text-warning"
    			},
    			$$inline: true
    		});

    	card16 = new Card({
    			props: {
    				title: "What is an interesting personal fact you could share?",
    				value: /*row*/ ctx[0]("whatisaninterestingpersonalfactyoucouldshare")
    			},
    			$$inline: true
    		});

    	card17 = new Card({
    			props: {
    				title: "Do you have any pets? What kind? ",
    				value: /*row*/ ctx[0]("whatdoyouenjoydoingafterwork")
    			},
    			$$inline: true
    		});

    	card18 = new Card({
    			props: {
    				title: "What is your favourite book?",
    				value: /*row*/ ctx[0]("whatisyourfavouritebook")
    			},
    			$$inline: true
    		});

    	card19 = new Card({
    			props: {
    				title: "What is your favourite movie?",
    				value: /*row*/ ctx[0]("whatisyourfavouritemovie")
    			},
    			$$inline: true
    		});

    	card20 = new Card({
    			props: {
    				title: "What is your favourite TV show?",
    				value: /*row*/ ctx[0]("whatisyourfavouritetvshow")
    			},
    			$$inline: true
    		});

    	card21 = new Card({
    			props: {
    				title: "What do you love to eat?",
    				value: /*row*/ ctx[0]("whatdoyoulovetoeat")
    			},
    			$$inline: true
    		});

    	card22 = new Card({
    			props: {
    				title: "What is your dream tourist destination?",
    				value: /*row*/ ctx[0]("whatisyourdreamtouristdestination")
    			},
    			$$inline: true
    		});

    	card23 = new Card({
    			props: {
    				title: "What is your spirit animal?",
    				value: /*row*/ ctx[0]("whatisyourspiritanimal")
    			},
    			$$inline: true
    		});

    	card24 = new Card({
    			props: {
    				title: "What is your favourite GIF? (provide a URL)",
    				value: /*row*/ ctx[0]("whatisyourfavouritegifprovideaurl")
    			},
    			$$inline: true
    		});

    	card25 = new Card({
    			props: {
    				title: "What is your favourite emoji? (provide a URL)",
    				value: /*row*/ ctx[0]("whatisyourfavouriteemojiprovideaurl")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "User Manual";
    			t1 = space();
    			button = element("button");
    			t2 = text("Menu\n\t\t\t\t");
    			i0 = element("i");
    			t3 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Working Style";
    			t5 = space();
    			li1 = element("li");
    			a2 = element("a");
    			a2.textContent = "Personal Background";
    			t7 = space();
    			li2 = element("li");
    			a3 = element("a");
    			a3.textContent = "Trivia";
    			t9 = space();
    			header = element("header");
    			div6 = element("div");
    			img = element("img");
    			t10 = space();
    			h1 = element("h1");
    			t11 = text(t11_value);
    			t12 = space();
    			div5 = element("div");
    			div2 = element("div");
    			t13 = space();
    			div3 = element("div");
    			i1 = element("i");
    			t14 = space();
    			div4 = element("div");
    			t15 = space();
    			p0 = element("p");
    			p0.textContent = "Welcome to my personal user manual";
    			t17 = space();
    			section0 = element("section");
    			div11 = element("div");
    			h20 = element("h2");
    			h20.textContent = "work-style";
    			t19 = space();
    			div10 = element("div");
    			div7 = element("div");
    			t20 = space();
    			div8 = element("div");
    			i2 = element("i");
    			t21 = space();
    			div9 = element("div");
    			t22 = space();
    			create_component(card0.$$.fragment);
    			t23 = space();
    			create_component(card1.$$.fragment);
    			t24 = space();
    			create_component(card2.$$.fragment);
    			t25 = space();
    			create_component(card3.$$.fragment);
    			t26 = space();
    			create_component(card4.$$.fragment);
    			t27 = space();
    			create_component(card5.$$.fragment);
    			t28 = space();
    			create_component(card6.$$.fragment);
    			t29 = space();
    			create_component(card7.$$.fragment);
    			t30 = space();
    			create_component(card8.$$.fragment);
    			t31 = space();
    			create_component(card9.$$.fragment);
    			t32 = space();
    			create_component(card10.$$.fragment);
    			t33 = space();
    			create_component(card11.$$.fragment);
    			t34 = space();
    			create_component(card12.$$.fragment);
    			t35 = space();
    			create_component(card13.$$.fragment);
    			t36 = space();
    			section1 = element("section");
    			div16 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Personal Background";
    			t38 = space();
    			div15 = element("div");
    			div12 = element("div");
    			t39 = space();
    			div13 = element("div");
    			i3 = element("i");
    			t40 = space();
    			div14 = element("div");
    			t41 = space();
    			create_component(card14.$$.fragment);
    			t42 = space();
    			create_component(card15.$$.fragment);
    			t43 = space();
    			section2 = element("section");
    			div21 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Trivia";
    			t45 = space();
    			div20 = element("div");
    			div17 = element("div");
    			t46 = space();
    			div18 = element("div");
    			i4 = element("i");
    			t47 = space();
    			div19 = element("div");
    			t48 = space();
    			create_component(card16.$$.fragment);
    			t49 = space();
    			create_component(card17.$$.fragment);
    			t50 = space();
    			create_component(card18.$$.fragment);
    			t51 = space();
    			create_component(card19.$$.fragment);
    			t52 = space();
    			create_component(card20.$$.fragment);
    			t53 = space();
    			create_component(card21.$$.fragment);
    			t54 = space();
    			create_component(card22.$$.fragment);
    			t55 = space();
    			create_component(card23.$$.fragment);
    			t56 = space();
    			create_component(card24.$$.fragment);
    			t57 = space();
    			create_component(card25.$$.fragment);
    			t58 = space();
    			footer = element("footer");
    			div25 = element("div");
    			div24 = element("div");
    			div22 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Location";
    			t60 = space();
    			p1 = element("p");
    			t61 = text("18/1 Margaret St\n\t\t\t\t\t\t");
    			br = element("br");
    			t62 = text("\n\t\t\t\t\t\tSydney NSW 2000");
    			t63 = space();
    			div23 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Around the Web";
    			t65 = space();
    			a4 = element("a");
    			i5 = element("i");
    			t66 = space();
    			a5 = element("a");
    			i6 = element("i");
    			t67 = space();
    			a6 = element("a");
    			i7 = element("i");
    			t68 = space();
    			a7 = element("a");
    			i8 = element("i");
    			t69 = space();
    			div27 = element("div");
    			div26 = element("div");
    			small = element("small");
    			small.textContent = "Copyright © Personal User Manual 2020";
    			t71 = space();
    			div28 = element("div");
    			a8 = element("a");
    			i9 = element("i");
    			attr_dev(a0, "class", "navbar-brand js-scroll-trigger");
    			attr_dev(a0, "href", "#page-top");
    			add_location(a0, file$1, 36, 3, 1157);
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$1, 39, 4, 1518);
    			attr_dev(button, "class", "navbar-toggler navbar-toggler-right text-uppercase font-weight-bold bg-primary text-white rounded");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarResponsive");
    			attr_dev(button, "aria-controls", "navbarResponsive");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$1, 37, 3, 1235);
    			attr_dev(a1, "class", "nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger");
    			attr_dev(a1, "href", "#work-style");
    			add_location(a1, file$1, 43, 39, 1698);
    			attr_dev(li0, "class", "nav-item mx-0 mx-lg-1");
    			add_location(li0, file$1, 43, 5, 1664);
    			attr_dev(a2, "class", "nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger");
    			attr_dev(a2, "href", "#personal-background");
    			add_location(a2, file$1, 44, 39, 1843);
    			attr_dev(li1, "class", "nav-item mx-0 mx-lg-1");
    			add_location(li1, file$1, 44, 5, 1809);
    			attr_dev(a3, "class", "nav-link py-3 px-0 px-lg-3 rounded js-scroll-trigger");
    			attr_dev(a3, "href", "#trivia");
    			add_location(a3, file$1, 45, 39, 2003);
    			attr_dev(li2, "class", "nav-item mx-0 mx-lg-1");
    			add_location(li2, file$1, 45, 5, 1969);
    			attr_dev(ul, "class", "navbar-nav ml-auto");
    			add_location(ul, file$1, 42, 4, 1627);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarResponsive");
    			add_location(div0, file$1, 41, 3, 1562);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$1, 35, 2, 1130);
    			attr_dev(nav, "class", "navbar navbar-expand-lg bg-secondary text-uppercase fixed-top");
    			attr_dev(nav, "id", "mainNav");
    			add_location(nav, file$1, 34, 1, 1039);
    			attr_dev(img, "class", "masthead-avatar mb-5");
    			if (img.src !== (img_src_value = "assets/img/avataaars.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 54, 3, 2314);
    			attr_dev(h1, "class", "masthead-heading text-uppercase mb-0");
    			add_location(h1, file$1, 56, 3, 2420);
    			attr_dev(div2, "class", "divider-custom-line");
    			add_location(div2, file$1, 59, 4, 2572);
    			attr_dev(i1, "class", "fas fa-star");
    			add_location(i1, file$1, 60, 37, 2649);
    			attr_dev(div3, "class", "divider-custom-icon");
    			add_location(div3, file$1, 60, 4, 2616);
    			attr_dev(div4, "class", "divider-custom-line");
    			add_location(div4, file$1, 61, 4, 2687);
    			attr_dev(div5, "class", "divider-custom divider-light");
    			add_location(div5, file$1, 58, 3, 2525);
    			attr_dev(p0, "class", "masthead-subheading font-weight-light mb-0");
    			add_location(p0, file$1, 64, 3, 2771);
    			attr_dev(div6, "class", "container d-flex align-items-center flex-column");
    			add_location(div6, file$1, 52, 2, 2216);
    			attr_dev(header, "class", "masthead bg-primary text-white text-center");
    			add_location(header, file$1, 51, 1, 2154);
    			attr_dev(h20, "class", "page-section-heading text-center text-uppercase text-secondary mb-0");
    			add_location(h20, file$1, 71, 3, 3035);
    			attr_dev(div7, "class", "divider-custom-line");
    			add_location(div7, file$1, 74, 4, 3191);
    			attr_dev(i2, "class", "fas fa-star");
    			add_location(i2, file$1, 75, 37, 3268);
    			attr_dev(div8, "class", "divider-custom-icon");
    			add_location(div8, file$1, 75, 4, 3235);
    			attr_dev(div9, "class", "divider-custom-line");
    			add_location(div9, file$1, 76, 4, 3306);
    			attr_dev(div10, "class", "divider-custom");
    			add_location(div10, file$1, 73, 3, 3158);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$1, 69, 2, 2971);
    			attr_dev(section0, "class", "page-section portfolio");
    			attr_dev(section0, "id", "work-style");
    			add_location(section0, file$1, 68, 1, 2912);
    			attr_dev(h21, "class", "page-section-heading text-center text-uppercase text-white");
    			add_location(h21, file$1, 114, 3, 5078);
    			attr_dev(div12, "class", "divider-custom-line");
    			add_location(div12, file$1, 117, 4, 5248);
    			attr_dev(i3, "class", "fas fa-star");
    			add_location(i3, file$1, 118, 37, 5325);
    			attr_dev(div13, "class", "divider-custom-icon");
    			add_location(div13, file$1, 118, 4, 5292);
    			attr_dev(div14, "class", "divider-custom-line");
    			add_location(div14, file$1, 119, 4, 5363);
    			attr_dev(div15, "class", "divider-custom divider-light");
    			add_location(div15, file$1, 116, 3, 5201);
    			attr_dev(div16, "class", "container");
    			add_location(div16, file$1, 112, 2, 5018);
    			attr_dev(section1, "class", "page-section bg-primary text-white mb-0");
    			attr_dev(section1, "id", "personal-background");
    			add_location(section1, file$1, 111, 1, 4933);
    			attr_dev(h22, "class", "page-section-heading text-center text-uppercase text-secondary mb-0");
    			add_location(h22, file$1, 134, 3, 5814);
    			attr_dev(div17, "class", "divider-custom-line");
    			add_location(div17, file$1, 137, 4, 5966);
    			attr_dev(i4, "class", "fas fa-star");
    			add_location(i4, file$1, 138, 37, 6043);
    			attr_dev(div18, "class", "divider-custom-icon");
    			add_location(div18, file$1, 138, 4, 6010);
    			attr_dev(div19, "class", "divider-custom-line");
    			add_location(div19, file$1, 139, 4, 6081);
    			attr_dev(div20, "class", "divider-custom");
    			add_location(div20, file$1, 136, 3, 5933);
    			attr_dev(div21, "class", "container");
    			add_location(div21, file$1, 132, 2, 5752);
    			attr_dev(section2, "class", "page-section");
    			attr_dev(section2, "id", "trivia");
    			add_location(section2, file$1, 131, 1, 5707);
    			attr_dev(h40, "class", "text-uppercase mb-4");
    			add_location(h40, file$1, 177, 5, 7395);
    			add_location(br, file$1, 180, 6, 7497);
    			attr_dev(p1, "class", "lead mb-0");
    			add_location(p1, file$1, 178, 5, 7446);
    			attr_dev(div22, "class", "col-lg-6 mb-5 mb-lg-0");
    			add_location(div22, file$1, 176, 4, 7354);
    			attr_dev(h41, "class", "text-uppercase mb-4");
    			add_location(h41, file$1, 186, 5, 7624);
    			attr_dev(i5, "class", "fab fa-fw fa-facebook-f");
    			add_location(i5, file$1, 187, 64, 7740);
    			attr_dev(a4, "class", "btn btn-outline-light btn-social mx-1");
    			attr_dev(a4, "href", "#!");
    			add_location(a4, file$1, 187, 5, 7681);
    			attr_dev(i6, "class", "fab fa-fw fa-twitter");
    			add_location(i6, file$1, 188, 64, 7848);
    			attr_dev(a5, "class", "btn btn-outline-light btn-social mx-1");
    			attr_dev(a5, "href", "#!");
    			add_location(a5, file$1, 188, 5, 7789);
    			attr_dev(i7, "class", "fab fa-fw fa-linkedin-in");
    			add_location(i7, file$1, 189, 64, 7953);
    			attr_dev(a6, "class", "btn btn-outline-light btn-social mx-1");
    			attr_dev(a6, "href", "#!");
    			add_location(a6, file$1, 189, 5, 7894);
    			attr_dev(i8, "class", "fab fa-fw fa-dribbble");
    			add_location(i8, file$1, 190, 64, 8062);
    			attr_dev(a7, "class", "btn btn-outline-light btn-social mx-1");
    			attr_dev(a7, "href", "#!");
    			add_location(a7, file$1, 190, 5, 8003);
    			attr_dev(div23, "class", "col-lg-6 mb-5 mb-lg-0");
    			add_location(div23, file$1, 185, 4, 7583);
    			attr_dev(div24, "class", "row");
    			add_location(div24, file$1, 174, 3, 7304);
    			attr_dev(div25, "class", "container");
    			add_location(div25, file$1, 173, 2, 7277);
    			attr_dev(footer, "class", "footer text-center");
    			add_location(footer, file$1, 172, 1, 7239);
    			add_location(small, file$1, 198, 25, 8251);
    			attr_dev(div26, "class", "container");
    			add_location(div26, file$1, 198, 2, 8228);
    			attr_dev(div27, "class", "copyright py-4 text-center text-white");
    			add_location(div27, file$1, 197, 1, 8174);
    			attr_dev(i9, "class", "fa fa-chevron-up");
    			add_location(i9, file$1, 202, 87, 8542);
    			attr_dev(a8, "class", "js-scroll-trigger d-block text-center text-white rounded");
    			attr_dev(a8, "href", "#page-top");
    			add_location(a8, file$1, 202, 2, 8457);
    			attr_dev(div28, "class", "scroll-to-top d-lg-none position-fixed");
    			add_location(div28, file$1, 201, 1, 8402);
    			attr_dev(main, "id", "page-top");
    			add_location(main, file$1, 32, 0, 997);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, nav);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, t2);
    			append_dev(button, i0);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(main, t9);
    			append_dev(main, header);
    			append_dev(header, div6);
    			append_dev(div6, img);
    			append_dev(div6, t10);
    			append_dev(div6, h1);
    			append_dev(h1, t11);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div5, t13);
    			append_dev(div5, div3);
    			append_dev(div3, i1);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div6, t15);
    			append_dev(div6, p0);
    			append_dev(main, t17);
    			append_dev(main, section0);
    			append_dev(section0, div11);
    			append_dev(div11, h20);
    			append_dev(div11, t19);
    			append_dev(div11, div10);
    			append_dev(div10, div7);
    			append_dev(div10, t20);
    			append_dev(div10, div8);
    			append_dev(div8, i2);
    			append_dev(div10, t21);
    			append_dev(div10, div9);
    			append_dev(div11, t22);
    			mount_component(card0, div11, null);
    			append_dev(div11, t23);
    			mount_component(card1, div11, null);
    			append_dev(div11, t24);
    			mount_component(card2, div11, null);
    			append_dev(div11, t25);
    			mount_component(card3, div11, null);
    			append_dev(div11, t26);
    			mount_component(card4, div11, null);
    			append_dev(div11, t27);
    			mount_component(card5, div11, null);
    			append_dev(div11, t28);
    			mount_component(card6, div11, null);
    			append_dev(div11, t29);
    			mount_component(card7, div11, null);
    			append_dev(div11, t30);
    			mount_component(card8, div11, null);
    			append_dev(div11, t31);
    			mount_component(card9, div11, null);
    			append_dev(div11, t32);
    			mount_component(card10, div11, null);
    			append_dev(div11, t33);
    			mount_component(card11, div11, null);
    			append_dev(div11, t34);
    			mount_component(card12, div11, null);
    			append_dev(div11, t35);
    			mount_component(card13, div11, null);
    			append_dev(main, t36);
    			append_dev(main, section1);
    			append_dev(section1, div16);
    			append_dev(div16, h21);
    			append_dev(div16, t38);
    			append_dev(div16, div15);
    			append_dev(div15, div12);
    			append_dev(div15, t39);
    			append_dev(div15, div13);
    			append_dev(div13, i3);
    			append_dev(div15, t40);
    			append_dev(div15, div14);
    			append_dev(div16, t41);
    			mount_component(card14, div16, null);
    			append_dev(div16, t42);
    			mount_component(card15, div16, null);
    			append_dev(main, t43);
    			append_dev(main, section2);
    			append_dev(section2, div21);
    			append_dev(div21, h22);
    			append_dev(div21, t45);
    			append_dev(div21, div20);
    			append_dev(div20, div17);
    			append_dev(div20, t46);
    			append_dev(div20, div18);
    			append_dev(div18, i4);
    			append_dev(div20, t47);
    			append_dev(div20, div19);
    			append_dev(div21, t48);
    			mount_component(card16, div21, null);
    			append_dev(div21, t49);
    			mount_component(card17, div21, null);
    			append_dev(div21, t50);
    			mount_component(card18, div21, null);
    			append_dev(div21, t51);
    			mount_component(card19, div21, null);
    			append_dev(div21, t52);
    			mount_component(card20, div21, null);
    			append_dev(div21, t53);
    			mount_component(card21, div21, null);
    			append_dev(div21, t54);
    			mount_component(card22, div21, null);
    			append_dev(div21, t55);
    			mount_component(card23, div21, null);
    			append_dev(div21, t56);
    			mount_component(card24, div21, null);
    			append_dev(div21, t57);
    			mount_component(card25, div21, null);
    			append_dev(main, t58);
    			append_dev(main, footer);
    			append_dev(footer, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div22);
    			append_dev(div22, h40);
    			append_dev(div22, t60);
    			append_dev(div22, p1);
    			append_dev(p1, t61);
    			append_dev(p1, br);
    			append_dev(p1, t62);
    			append_dev(div24, t63);
    			append_dev(div24, div23);
    			append_dev(div23, h41);
    			append_dev(div23, t65);
    			append_dev(div23, a4);
    			append_dev(a4, i5);
    			append_dev(div23, t66);
    			append_dev(div23, a5);
    			append_dev(a5, i6);
    			append_dev(div23, t67);
    			append_dev(div23, a6);
    			append_dev(a6, i7);
    			append_dev(div23, t68);
    			append_dev(div23, a7);
    			append_dev(a7, i8);
    			append_dev(main, t69);
    			append_dev(main, div27);
    			append_dev(div27, div26);
    			append_dev(div26, small);
    			append_dev(main, t71);
    			append_dev(main, div28);
    			append_dev(div28, a8);
    			append_dev(a8, i9);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*row*/ 1) && t11_value !== (t11_value = /*row*/ ctx[0]("whatisyourname") + "")) set_data_dev(t11, t11_value);
    			const card0_changes = {};
    			if (dirty & /*row*/ 1) card0_changes.value = /*row*/ ctx[0]("whatisyourfavouritecommunicationmethod");
    			card0.$set(card0_changes);
    			const card1_changes = {};
    			if (dirty & /*row*/ 1) card1_changes.value = /*row*/ ctx[0]("howdoyouliketoreceivefeedback");
    			card1.$set(card1_changes);
    			const card2_changes = {};
    			if (dirty & /*row*/ 1) card2_changes.value = /*row*/ ctx[0]("whendoyoudoyourbestwork");
    			card2.$set(card2_changes);
    			const card3_changes = {};
    			if (dirty & /*row*/ 1) card3_changes.value = /*row*/ ctx[0]("howdoyoulearnbest");
    			card3.$set(card3_changes);
    			const card4_changes = {};
    			if (dirty & /*row*/ 1) card4_changes.value = /*row*/ ctx[0]("whatareyourstrengths");
    			card4.$set(card4_changes);
    			const card5_changes = {};
    			if (dirty & /*row*/ 1) card5_changes.value = /*row*/ ctx[0]("whatareyourweaknesses");
    			card5.$set(card5_changes);
    			const card6_changes = {};
    			if (dirty & /*row*/ 1) card6_changes.value = /*row*/ ctx[0]("whichtechnologystackareyoustrongestwith");
    			card6.$set(card6_changes);
    			const card7_changes = {};
    			if (dirty & /*row*/ 1) card7_changes.value = /*row*/ ctx[0]("whatdoyoustrugglewith");
    			card7.$set(card7_changes);
    			const card8_changes = {};
    			if (dirty & /*row*/ 1) card8_changes.value = /*row*/ ctx[0]("whatdoyoufindfrustratinginaworkenvironment");
    			card8.$set(card8_changes);
    			const card9_changes = {};
    			if (dirty & /*row*/ 1) card9_changes.value = /*row*/ ctx[0]("whatcomputerosdoyoulike");
    			card9.$set(card9_changes);
    			const card10_changes = {};
    			if (dirty & /*row*/ 1) card10_changes.value = /*row*/ ctx[0]("whatisyourfavouritecodeeditingtool");
    			card10.$set(card10_changes);
    			const card11_changes = {};
    			if (dirty & /*row*/ 1) card11_changes.value = /*row*/ ctx[0]("ifyouwouldlikesharesomelinkstoyoursocialmediaaccountspersonalblogetc");
    			card11.$set(card11_changes);
    			const card12_changes = {};
    			if (dirty & /*row*/ 1) card12_changes.value = /*row*/ ctx[0]("wouldyousayyouaremoreintrovertedorextroverted");
    			card12.$set(card12_changes);
    			const card13_changes = {};
    			if (dirty & /*row*/ 1) card13_changes.value = /*row*/ ctx[0]("doyouhaveanypetswhatkind");
    			card13.$set(card13_changes);
    			const card14_changes = {};
    			if (dirty & /*row*/ 1) card14_changes.value = /*row*/ ctx[0]("whatdoyouprefertobecalled");
    			card14.$set(card14_changes);
    			const card15_changes = {};
    			if (dirty & /*row*/ 1) card15_changes.value = /*row*/ ctx[0]("doyoupreferiphoneorandroid");
    			card15.$set(card15_changes);
    			const card16_changes = {};
    			if (dirty & /*row*/ 1) card16_changes.value = /*row*/ ctx[0]("whatisaninterestingpersonalfactyoucouldshare");
    			card16.$set(card16_changes);
    			const card17_changes = {};
    			if (dirty & /*row*/ 1) card17_changes.value = /*row*/ ctx[0]("whatdoyouenjoydoingafterwork");
    			card17.$set(card17_changes);
    			const card18_changes = {};
    			if (dirty & /*row*/ 1) card18_changes.value = /*row*/ ctx[0]("whatisyourfavouritebook");
    			card18.$set(card18_changes);
    			const card19_changes = {};
    			if (dirty & /*row*/ 1) card19_changes.value = /*row*/ ctx[0]("whatisyourfavouritemovie");
    			card19.$set(card19_changes);
    			const card20_changes = {};
    			if (dirty & /*row*/ 1) card20_changes.value = /*row*/ ctx[0]("whatisyourfavouritetvshow");
    			card20.$set(card20_changes);
    			const card21_changes = {};
    			if (dirty & /*row*/ 1) card21_changes.value = /*row*/ ctx[0]("whatdoyoulovetoeat");
    			card21.$set(card21_changes);
    			const card22_changes = {};
    			if (dirty & /*row*/ 1) card22_changes.value = /*row*/ ctx[0]("whatisyourdreamtouristdestination");
    			card22.$set(card22_changes);
    			const card23_changes = {};
    			if (dirty & /*row*/ 1) card23_changes.value = /*row*/ ctx[0]("whatisyourspiritanimal");
    			card23.$set(card23_changes);
    			const card24_changes = {};
    			if (dirty & /*row*/ 1) card24_changes.value = /*row*/ ctx[0]("whatisyourfavouritegifprovideaurl");
    			card24.$set(card24_changes);
    			const card25_changes = {};
    			if (dirty & /*row*/ 1) card25_changes.value = /*row*/ ctx[0]("whatisyourfavouriteemojiprovideaurl");
    			card25.$set(card25_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(card3.$$.fragment, local);
    			transition_in(card4.$$.fragment, local);
    			transition_in(card5.$$.fragment, local);
    			transition_in(card6.$$.fragment, local);
    			transition_in(card7.$$.fragment, local);
    			transition_in(card8.$$.fragment, local);
    			transition_in(card9.$$.fragment, local);
    			transition_in(card10.$$.fragment, local);
    			transition_in(card11.$$.fragment, local);
    			transition_in(card12.$$.fragment, local);
    			transition_in(card13.$$.fragment, local);
    			transition_in(card14.$$.fragment, local);
    			transition_in(card15.$$.fragment, local);
    			transition_in(card16.$$.fragment, local);
    			transition_in(card17.$$.fragment, local);
    			transition_in(card18.$$.fragment, local);
    			transition_in(card19.$$.fragment, local);
    			transition_in(card20.$$.fragment, local);
    			transition_in(card21.$$.fragment, local);
    			transition_in(card22.$$.fragment, local);
    			transition_in(card23.$$.fragment, local);
    			transition_in(card24.$$.fragment, local);
    			transition_in(card25.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(card3.$$.fragment, local);
    			transition_out(card4.$$.fragment, local);
    			transition_out(card5.$$.fragment, local);
    			transition_out(card6.$$.fragment, local);
    			transition_out(card7.$$.fragment, local);
    			transition_out(card8.$$.fragment, local);
    			transition_out(card9.$$.fragment, local);
    			transition_out(card10.$$.fragment, local);
    			transition_out(card11.$$.fragment, local);
    			transition_out(card12.$$.fragment, local);
    			transition_out(card13.$$.fragment, local);
    			transition_out(card14.$$.fragment, local);
    			transition_out(card15.$$.fragment, local);
    			transition_out(card16.$$.fragment, local);
    			transition_out(card17.$$.fragment, local);
    			transition_out(card18.$$.fragment, local);
    			transition_out(card19.$$.fragment, local);
    			transition_out(card20.$$.fragment, local);
    			transition_out(card21.$$.fragment, local);
    			transition_out(card22.$$.fragment, local);
    			transition_out(card23.$$.fragment, local);
    			transition_out(card24.$$.fragment, local);
    			transition_out(card25.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(card0);
    			destroy_component(card1);
    			destroy_component(card2);
    			destroy_component(card3);
    			destroy_component(card4);
    			destroy_component(card5);
    			destroy_component(card6);
    			destroy_component(card7);
    			destroy_component(card8);
    			destroy_component(card9);
    			destroy_component(card10);
    			destroy_component(card11);
    			destroy_component(card12);
    			destroy_component(card13);
    			destroy_component(card14);
    			destroy_component(card15);
    			destroy_component(card16);
    			destroy_component(card17);
    			destroy_component(card18);
    			destroy_component(card19);
    			destroy_component(card20);
    			destroy_component(card21);
    			destroy_component(card22);
    			destroy_component(card23);
    			destroy_component(card24);
    			destroy_component(card25);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const spreadsheetID = "19e8Ku8HkchntzoCF6S2h9DrM3mibvcDMMdAjxcWDsgk";
    const sheetNumber = 1;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const url = `https://spreadsheets.google.com/feeds/list/${spreadsheetID}/${sheetNumber}/public/values?alt=json`;
    	let currentUser = { gsx$whatisyourname: "" };

    	async function hashchange() {
    		const query = new URLSearchParams(window.location.search);
    		const data = await fetch(url).then(r => r.json());
    		const entries = data && data.feed && data.feed.entry || [];
    		const userName = query.get("name");

    		$$invalidate(1, currentUser = {
    			...currentUser,
    			...!userName
    			? entries[entries.length - 1]
    			: entries.find(i => i.gsx$whatisyourname && i.gsx$whatisyourname.$t === userName)
    		});

    		window.scrollTo(0, 0);
    	}

    	onMount(hashchange);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Card,
    		spreadsheetID,
    		sheetNumber,
    		url,
    		currentUser,
    		hashchange,
    		row
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentUser" in $$props) $$invalidate(1, currentUser = $$props.currentUser);
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    	};

    	let row;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentUser*/ 2) {
    			 $$invalidate(0, row = prop => {
    				const value = currentUser["gsx$" + prop];
    				return value && value.$t || "";
    			});
    		}
    	};

    	return [row, currentUser];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
