function InfoDialog() {
  return (
    <div
      style={{
        overflowY: 'auto',
        maxHeight: 'inherit',
        maxWidth: 'inherit',
      }}
    >
      <div>
        <section>
          <h4>Add dependencies</h4>
          <p>
            You can add dependencies with the "Add Dependecy" button over the gantt chart. You have
            to select two issues which are founded in the gant chart at the moment and have to press
            the add button after that. After a short load the line marking the dependency will
            appear in the gantt chart.
          </p>
        </section>
        <section style={{ paddingTop: '10px' }}>
          <h4>Issues in the gant chart</h4>
          <p>Issues which haven't got start and end date are not presented in the gantt chart.</p>
          <p>
            Issues which haven't got start or end date are appeared with a mixed color and with a
            timespan of one month from the date which is present. The lighter end of the timeline
            means that the issue hasn't got the date on that side.
          </p>
          <p>Epic typed issus can have childrens.</p>
          <p>To jump to an issue press the start or the end date of it.</p>
        </section>
        <section style={{ paddingTop: '10px' }}>
          <h4>Modify the timespan of an issue</h4>
          <p>
            Go to the bar of the selected issue and drag the end of the bar on the side which you
            want to modify.
          </p>
          <p>
            If you don't want to chage the timespan itself just the start and end date, drag the bar
            in the middle to the position you want.
          </p>
          <p>
            If an issue doesn't have a timeline yet hover over the line of the issue on the left
            side and press the plus symbol. After that you can modify the timespan of it.
          </p>
        </section>
      </div>
    </div>
  );
}

export default InfoDialog;
