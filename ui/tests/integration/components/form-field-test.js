import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { create } from 'ember-cli-page-object';
import sinon from 'sinon';
import formFields from '../../pages/components/form-field';

const component = create(formFields);

module('Integration | Component | form field', function (hooks) {
  setupRenderingTest(hooks);

  const createAttr = (name, type, options) => {
    return {
      name,
      type,
      options,
    };
  };

  const setup = async function (attr) {
    let model = EmberObject.create({});
    let spy = sinon.spy();
    this.set('onChange', spy);
    this.set('model', model);
    this.set('attr', attr);
    await render(hbs`<FormField @attr={{this.attr}} @model={{this.model}} @onChange={{this.onChange}} />`);
    return [model, spy];
  };

  test('it renders', async function (assert) {
    let model = EmberObject.create({});
    this.attr = { name: 'foo' };
    this.model = model;
    await render(hbs`<FormField @attr={{this.attr}} @model={{this.model}} />`);

    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.notOk(component.hasInput, 'renders only the label');
  });

  test('it renders: string', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('foo', 'string', { defaultValue: 'default' }));
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.equal(component.fields.objectAt(0).inputValue, 'default', 'renders default value');
    assert.ok(component.hasInput, 'renders input for string');
    await component.fields.objectAt(0).input('bar').change();

    assert.equal(model.get('foo'), 'bar');
    assert.ok(spy.calledWith('foo', 'bar'), 'onChange called with correct args');
  });

  test('it renders: boolean', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('foo', 'boolean', { defaultValue: false }));
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.notOk(component.fields.objectAt(0).inputChecked, 'renders default value');
    assert.ok(component.hasCheckbox, 'renders a checkbox for boolean');
    await component.fields.objectAt(0).clickLabel();

    assert.true(model.get('foo'));
    assert.ok(spy.calledWith('foo', true), 'onChange called with correct args');
  });

  test('it renders: number', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('foo', 'number', { defaultValue: 5 }));
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.equal(component.fields.objectAt(0).inputValue, 5, 'renders default value');
    assert.ok(component.hasInput, 'renders input for number');
    await component.fields.objectAt(0).input(8).change();

    assert.equal(model.get('foo'), 8);
    assert.ok(spy.calledWith('foo', '8'), 'onChange called with correct args');
  });

  test('it renders: object', async function (assert) {
    await setup.call(this, createAttr('foo', 'object'));
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.ok(component.hasJSONEditor, 'renders the json editor');
  });

  test('it renders: string as json with clear button', async function (assert) {
    await setup.call(this, createAttr('foo', 'string', { editType: 'json', allowReset: true }));
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.ok(component.hasJSONEditor, 'renders the json editor');
    assert.ok(component.hasJSONClearButton, 'renders button that will clear the JSON value');
  });

  test('it renders: editType textarea', async function (assert) {
    let [model, spy] = await setup.call(
      this,
      createAttr('foo', 'string', { defaultValue: 'goodbye', editType: 'textarea' })
    );
    assert.equal(component.fields.objectAt(0).labelText, 'Foo', 'renders a label');
    assert.ok(component.hasTextarea, 'renders a textarea');
    assert.equal(component.fields.objectAt(0).textareaValue, 'goodbye', 'renders default value');
    await component.fields.objectAt(0).textarea('hello');

    assert.equal(model.get('foo'), 'hello');
    assert.ok(spy.calledWith('foo', 'hello'), 'onChange called with correct args');
  });

  test('it renders: editType file', async function (assert) {
    await setup.call(this, createAttr('foo', 'string', { editType: 'file' }));
    assert.ok(component.hasTextFile, 'renders the text-file component');
    await click('[data-test-text-toggle]');
    await fillIn('[data-test-text-file-textarea]', 'hello world');
    assert.dom('[data-test-text-file-textarea]').hasClass('masked-font');
    await click('[data-test-button]');
    assert.dom('[data-test-text-file-textarea]').doesNotHaveClass('masked-font');
  });

  test('it renders: editType ttl', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('foo', null, { editType: 'ttl' }));
    assert.ok(component.hasTTLPicker, 'renders the ttl-picker component');
    await component.fields.objectAt(0).toggleTtl();
    await component.fields.objectAt(0).select('h').change();
    await component.fields.objectAt(0).ttlTime('3');
    const expectedSeconds = `${3 * 3600}s`;
    assert.equal(model.get('foo'), expectedSeconds);
    assert.ok(spy.calledWith('foo', expectedSeconds), 'onChange called with correct args');
  });

  test('it renders: editType stringArray', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('foo', 'string', { editType: 'stringArray' }));
    assert.ok(component.hasStringList, 'renders the string-list component');

    await component.fields.objectAt(0).textarea('array').change();
    assert.deepEqual(model.get('foo'), ['array'], 'sets the value on the model');
    assert.deepEqual(spy.args[0], ['foo', ['array']], 'onChange called with correct args');
  });

  test('it renders: sensitive', async function (assert) {
    let [model, spy] = await setup.call(this, createAttr('password', 'string', { sensitive: true }));
    assert.ok(component.hasMaskedInput, 'renders the masked-input component');
    await component.fields.objectAt(0).textarea('secret');
    assert.equal(model.get('password'), 'secret');
    assert.ok(spy.calledWith('password', 'secret'), 'onChange called with correct args');
  });

  test('it uses a passed label', async function (assert) {
    await setup.call(this, createAttr('foo', 'string', { label: 'Not Foo' }));
    assert.equal(component.fields.objectAt(0).labelText, 'Not Foo', 'renders the label from options');
  });

  test('it renders a help tooltip', async function (assert) {
    await setup.call(this, createAttr('foo', 'string', { helpText: 'Here is some help text' }));
    await component.tooltipTrigger();
    assert.ok(component.hasTooltip, 'renders the tooltip component');
  });

  test('it should not expand and toggle ttl when default 0s value is present', async function (assert) {
    assert.expect(2);

    this.setProperties({
      model: EmberObject.create({ foo: '0s' }),
      attr: createAttr('foo', null, { editType: 'ttl' }),
      onChange: () => {},
    });

    await render(hbs`<FormField @attr={{this.attr}} @model={{this.model}} @onChange={{this.onChange}} />`);
    assert
      .dom('[data-test-toggle-input="Foo"]')
      .isNotChecked('Toggle is initially unchecked when given default value');
    assert.dom('[data-test-ttl-picker-group="Foo"]').doesNotExist('Ttl input is hidden');
  });

  test('it should toggle and expand ttl when initial non default value is provided', async function (assert) {
    assert.expect(2);

    this.setProperties({
      model: EmberObject.create({ foo: '1s' }),
      attr: createAttr('foo', null, { editType: 'ttl' }),
      onChange: () => {},
    });

    await render(hbs`<FormField @attr={{this.attr}} @model={{this.model}} @onChange={{this.onChange}} />`);
    assert.dom('[data-test-toggle-input="Foo"]').isChecked('Toggle is initially checked when given value');
    assert.dom('[data-test-ttl-value="Foo"]').hasValue('1', 'Ttl input displays with correct value');
  });
});
